# ERC-8010 Demo Project — Implementation Plan

## Context

**ERC-8010** (Pre-delegated Signature Verification) 是一个 Draft 状态的以太坊标准，定义了在 EIP-7702 代理场景下的签名验证方案。

**核心问题**：EIP-7702 允许 EOA 通过设置代码来委托给智能合约（delegate），但用户可能在委托交易上链之前就签名了消息。现有的 ERC-1271（合约账户签名验证）和 ERC-6492（CREATE2 预部署验证）都无法验证这种"预委托"签名。ERC-8010 通过定义标准化的签名包装格式和链下验证流程填补了这一空白。

**签名包装格式**：

```shell
wrapped_signature = inner_signature || context || context_length || MAGIC
```

- `inner_signature`：被委托合约 ERC-1271 验证的内部签名
- `context`：`abi.encode(authorization, init_to, init_data)`，包含 EIP-7702 授权元组
- `context_length`：context 的 uint32 大端长度
- `MAGIC`：`0x8010801080108010801080108010801080108010801080108010801080108010`（32 字节标记）

**验证流程**：viem 的 `verifyHash` 自动检测 MAGIC 标记，若检测到则在 `eth_call` 中模拟 EIP-7702 委托，并原子执行 `init_to.call(init_data)` 和 `isValidSignature(digest, signature)`。若未检测到 MAGIC 则回退到 ERC-6492。

本项目旨在通过一个完整的交互式 Demo 展示 ERC-8010 的完整工作流，帮助开发者理解和使用这一标准。

---

## 技术选型

| 层级 | 技术 | 版本 | 选型依据 |
|------|------|------|----------|
| 智能合约 | Solidity + Foundry | 0.8.28+ / latest | EIP-7702 需 Prague EVM，Foundry 内置 EIP-7702 cheatcode |
| 链交互 | viem | ^2.53 | viem 内置 ERC-8010 支持（verifyHash/verifyTypedData），由 ERC-8010 主作者 @jxom 维护 |
| 底层密码 | ox | 随 viem 内置 | hashMessage、recoverAddress、parseSignature 等密码学原语 |
| React Hooks | wagmi | ^3.6 | 与 viem v2 深度集成，提供 signMessage/signAuthorization 等 hooks |
| 前端框架 | Next.js 16 | ^16.2 | App Router、React 19、Tailwind v4 原生支持 |
| UI 组件 | shadcn/ui | latest | 基于 Radix + Tailwind，与 Next.js 16 兼容 |
| 样式 | Tailwind CSS | v4 | 随 Next.js 16 内置 |
| 图标 | lucide-react | latest | shadcn/ui 默认图标库 |

---

## 项目架构

```shell
erc8010/
├── contracts/                    # Foundry 项目
│   ├── foundry.toml
│   ├── src/
│   │   ├── SessionKeyValidator.sol    # 委托目标合约（实现 ERC-1271）
│   │   ├── SessionKeyInitializer.sol  # 初始化合约（演示 init_to/init_data）
│   │   └── interfaces/
│   │       └── IERC1271.sol           # ERC-1271 接口
│   ├── test/
│   │   ├── Erc8010Verification.t.sol  # ERC-8010 集成测试
│   │   ├── SessionKeyValidator.t.sol  # 单元测试
│   │   └── Eip7702Delegation.t.sol    # EIP-7702 cheatcode 测试
│   └── script/
│       └── Deploy.s.sol               # 部署脚本
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx                    # 根布局（Providers 包裹）
│   ├── page.tsx                      # 首页（Hero + 介绍卡片）
│   ├── providers.tsx                 # WagmiProvider + QueryClientProvider
│   ├── demo/
│   │   └── page.tsx                  # 核心 Demo 五步流程
│   └── explain/
│       └── page.tsx                  # ERC-8010 技术详解页
├── components/
│   ├── ui/                           # shadcn/ui 组件（自动生成）
│   ├── Navbar.tsx                    # 导航栏 + 钱包连接按钮
│   ├── StepIndicator.tsx             # 步骤指示器（1-5）
│   ├── StepCard.tsx                  # 步骤卡片包装器
│   ├── ByteVisualizer.tsx            # 签名字节可视化
│   ├── WrappedSignatureViewer.tsx    # ERC-8010 封装签名查看器
│   ├── VerificationResult.tsx        # 验证结果展示
│   └── WalletButton.tsx             # 钱包连接/断开按钮
├── lib/
│   ├── wagmi-config.ts              # wagmi 配置（chains, transports, connectors）
│   ├── erc8010.ts                   # ERC-8010 工具函数（wrap/unwrap/MAGIC）
│   ├── ox-helpers.ts                # ox 演示函数（hash、recover 等）
│   └── utils.ts                     # 通用工具（cn, 格式化等）
├── doc/
│   └── PLAN.md                      # 本文档
├── public/
│   └── ...                          # 静态资源
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 智能合约设计

### SessionKeyValidator.sol（核心委托合约）

**职责**：EOA 通过 EIP-7702 委托到此合约后，可以使用会话密钥（Session Key）代表 EOA 签名消息。

**接口**：

```solidity
interface ISessionKeyValidator {
    function authorizeSessionKey(address sessionKey, uint256 expiry) external;
    function revokeSessionKey(address sessionKey) external;
    function isSessionKeyAuthorized(address delegator, address sessionKey)
        external view returns (bool, uint256 expiry);
    function isValidSignature(bytes32 hash, bytes calldata signature)
        external view returns (bytes4); // ERC-1271
}
```

**isValidSignature 验证逻辑**：

1. 解码 `signature` → `(address sessionKey, bytes memory ecdsaSig)`
2. 检查 `sessionKey` 是否已授权且未过期
3. 从 `(hash, ecdsaSig)` 恢复签名地址
4. 若恢复地址 == sessionKey → 返回 `0x1626ba7e`（ERC-1271 MAGIC VALUE）
5. 否则返回 `0xffffffff`

**状态存储**：

```solidity
mapping(address delegator => mapping(address sessionKey => uint256 expiry)) public sessionKeyExpiry;
```

### SessionKeyInitializer.sol（初始化合约）

**职责**：在 EIP-7702 委托交易中原子初始化会话密钥。演示 ERC-8010 的 `init_to` / `init_data` 字段。

**接口**：

```solidity
function initialize(bytes calldata data) external;
// data = abi.encode(address[] sessionKeys, uint256[] expiries)
```

### IERC1271.sol（标准接口）

```solidity
interface IERC1271 {
    function isValidSignature(bytes32 hash, bytes calldata signature)
        external view returns (bytes4 magicValue);
}
```

---

## Foundry 配置与测试

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.28"
evm_version = "prague"   # EIP-7702 需要 Prague EVM
ffi = false
```

### 测试覆盖

| 测试文件 | 测试用例 | 说明 |
|----------|----------|------|
| `Erc8010Verification.t.sol` | `test_PredelegationSignatureWrapsAndVerifies` | 构建 ERC-8010 封装签名并验证 |
| | `test_PostDelegationSignatureVerifies` | 委托后 ERC-1271 直接验证 |
| | `test_MagicMarkerDetection` | MAGIC 标记检测 |
| | `test_InitDataAppliedAtomically` | init_to/init_data 原子执行 |
| `SessionKeyValidator.t.sol` | `test_AuthorizeAndValidate` | 授权→验证 happy path |
| | `test_ExpiredKeyFails` | 过期密钥拒绝 |
| | `test_RevokedKeyFails` | 撤销密钥拒绝 |
| | `test_UnauthorizedKeyFails` | 未授权密钥拒绝 |
| | `test_WrongSignerFails` | 签名不匹配 |
| `Eip7702Delegation.t.sol` | `test_SignAndAttachDelegation` | Foundry cheatcode 演示 |

---

## 前端设计

### 路由结构

| 路由 | 类型 | 说明 |
|------|------|------|
| `/` | Server + Client | 首页：Hero、ERC-8010 介绍卡片、快速开始 |
| `/demo` | Client | **核心**：五步交互式 Demo 流程 |
| `/explain` | Server | 技术详解：签名格式图解、验证流程图 |

### 核心 Demo 五步流程

```
Step 1: 签名消息（预委托）
  └─ 用户输入消息 → useSignMessage 签名
  └─ 展示原始 ECDSA 签名（inner_signature）

Step 2: 封装 ERC-8010 签名
  └─ signAuthorization 签署 EIP-7702 授权
  └─ wrapErc8010Signature() 构建 wrapped 签名
  └─ ByteVisualizer 颜色编码展示：inner_sig || context || context_len || MAGIC

Step 3: 链下验证（预委托验证）
  └─ publicClient.verifyHash() 自动检测 ERC-8010
  └─ viem 内部模拟委托 → eth_call → isValidSignature
  └─ 展示验证结果 + "发生了什么"说明

Step 4: 执行链上委托
  └─ useSendTransaction 发送 type-4 tx（含 authorizationList）
  └─ 交易确认 → getCode 展示 EOA 代码变化（空 → 0xef0100 || delegate）

Step 5: 委托后验证
  └─ 再次 verifyHash（同一签名）
  └─ viem 检测到已委托 → 直接走 ERC-1271
  └─ 前后对比表：预委托（ERC-8010 模拟） vs 委托后（ERC-1271 直接）
```

### 关键 viem 函数使用

| 函数 | 用途 |
|------|------|
| `publicClient.verifyHash` | 核心验证入口，自动检测 ERC-8010/6492/1271 |
| `walletClient.signMessage` | EOA 签名消息 |
| `walletClient.signAuthorization` | 签署 EIP-7702 授权元组 |
| `walletClient.sendTransaction` | 发送含 authorizationList 的 type-4 交易 |
| `publicClient.getCode` | 检查 EOA 是否已委托 |
| `encodeAbiParameters` | 构建 ERC-8010 context 编码 |
| `concat` / `size` / `slice` | 字节拼接/长度/切片 |
| `hashMessage` | EIP-191 消息哈希 |

### 关键 ox 函数使用（教学）

| 函数 | 用途 |
|------|------|
| `hashMessage` | 展示消息哈希计算过程 |
| `recoverAddress` | 从签名恢复地址 |
| `parseSignature` | 分解签名为 { r, s, v } |
| `serializeSignature` | 规范化签名格式 |

### shadcn/ui 组件清单

```
button card input label separator tabs badge toast tooltip
dialog accordion progress skeleton alert textarea
```

---

## 开发阶段

### Phase 1：智能合约与 Foundry 测试（预计 1 天）

- [ ] 初始化 Foundry 项目：`forge init contracts --no-git`
- [ ] 编写 `SessionKeyValidator.sol`
- [ ] 编写 `SessionKeyInitializer.sol`
- [ ] 编写 `IERC1271.sol` 接口
- [ ] 编写 ERC-8010 验证集成测试
- [ ] 编写 SessionKeyValidator 单元测试
- [ ] 编写 EIP-7702 委托测试
- [ ] 编写部署脚本 `Deploy.s.sol`
- [ ] 运行 `forge test` 全部通过
- [ ] 启动 Anvil（Prague EVM）：`anvil --hardfork prague`

### Phase 2：前端基础搭建（预计 1 天）

- [ ] `npx create-next-app@latest` + TypeScript + Tailwind
- [ ] 安装 shadcn/ui 并添加所需组件
- [ ] 配置 wagmi（chains: anvil + sepolia）
- [ ] 创建 `app/providers.tsx` 和 `app/layout.tsx`
- [ ] 构建 Navbar（Logo + 导航链接 + 钱包按钮）
- [ ] 构建首页 `/`（Hero + ERC-8010 介绍卡片）
- [ ] 构建 `/explain` 页（签名格式图解 + 验证流程图）

### Phase 3：核心 Demo 流程（预计 1-2 天）

- [ ] 编写 `lib/erc8010.ts`（wrap/unwrap/MAGIC 常量）
- [ ] 编写 `lib/ox-helpers.ts`
- [ ] 构建 Step1Card：消息签名
- [ ] 构建 Step2Card：ERC-8010 签名封装 + ByteVisualizer
- [ ] 构建 Step3Card：链下验证（预委托）
- [ ] 构建 Step4Card：链上委托执行
- [ ] 构建 Step5Card：委托后验证 + 对比表
- [ ] 组装 `app/demo/page.tsx` 完整流程

### Phase 4：打磨与文档（预计 1 天）

- [ ] 添加 loading skeletons、error toasts
- [ ] 移动端响应式适配
- [ ] 编写 README.md（项目介绍、安装、运行说明）
- [ ] 端到端测试（Anvil 本地 + Sepolia 测试网）
- [ ] 可选：添加 EIP-712 typed data 演示路径

---

## ERC-8010 签名可视化（ByteVisualizer 设计）

```
┌──────────────────────────────────────────────────────────────────┐
│ ERC-8010 Wrapped Signature Byte Layout                          │
├────────────┬──────────────────────┬───────────────┬─────────────┤
│ inner_sig │ context               │ context_len   │ MAGIC       │
│ (65 bytes) │ (variable)            │ (4 bytes)     │ (32 bytes)  │
│            │ ┌──────────────────┐ │ uint32 BE     │ 0x8010...   │
│            │ │ authorization    │ │               │ 0x8010      │
│            │ │  ├ chain_id      │ │               │             │
│            │ │  ├ delegate_addr │ │               │             │
│            │ │  ├ nonce         │ │               │             │
│            │ │  ├ y_parity      │ │               │             │
│            │ │  ├ r             │ │               │             │
│            │ │  └ s             │ │               │             │
│            │ │ init_to          │ │               │             │
│            │ │ init_data        │ │               │             │
│            │ └──────────────────┘ │               │             │
├────────────┴──────────────────────┴───────────────┴─────────────┤
│ 解析顺序：最后 32 字节 → MAGIC 检查 → 前 4 字节 → context_len  │
│ → 提取 context → 解码 authorization/init                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 数据流图

```
EOA (钱包私钥)
 │
 ├─[Step 1] signMessage("hello world")
 │  └─→ innerSignature (65-byte ECDSA)
 │
 ├─[Step 2] signAuthorization({ contractAddress: SessionKeyValidator })
 │  └─→ Authorization { chainId, address, nonce, yParity, r, s }
 │
 ├─[Step 2] wrapErc8010Signature({ innerSig, auth, initTo, initData })
 │  └─→ wrapped = innerSig || context || contextLen || MAGIC
 │
 ├─[Step 3] verifyHash({ address: EOA, hash, signature: wrapped })
 │  │  viem 内部:
 │  ├── 检测 MAGIC → 是 ERC-8010
 │  ├── 提取 authorization
 │  ├── 检查 EOA.code ≠ 0xef0100 || delegate（尚未委托）
 │  ├── eth_call(authorizationList: [auth]):
 │  │   ├── initTo.call(initData)  // 可选
 │  │   └── EOA.isValidSignature(hash, innerSig)
 │  └─→ true ✓
 │
 ├─[Step 4] sendTransaction({ to: EOA, authorizationList: [auth] })
 │  └─→ EOA.code = 0xef0100 || SessionKeyValidator
 │
 └─[Step 5] verifyHash({ address: EOA, hash, signature: wrapped })
    │  viem 内部:
    ├── 检测 MAGIC
    ├── 检查 EOA.code == 0xef0100 || delegate（已委托！）
    ├── 直接调用 EOA.isValidSignature(hash, innerSig)
    └─→ true ✓（同一结果，不同路径）
```

---

## 验证计划

### 智能合约

- `forge test` 所有测试通过
- `forge coverage` 覆盖率 > 90%
- 手动在 Anvil 上部署并交互验证

### 前端

- 本地 Anvil（`--hardfork prague`）运行完整五步流程
- 验证 ERC-8010 封装签名字节布局可视化正确
- 验证预委托/委托后两次 verifyHash 均返回 true
- Sepolia 测试网端到端验证
- 边界情况：错误网络、过期会话密钥、无效授权、损坏的 MAGIC

---

## 潜在风险与对策

1. **EIP-7702 需 Prague EVM**：Anvil 用 `--hardfork prague` 启动。Sepolia 已支持。
2. **钱包 signAuthorization 支持**：部分钱包不支持 RPC `wallet_signAuthorization`。备选：用 `privateKeyToAccount` 本地签名，并在 UI 中明确标注。
3. **verifyHash 需要 Multicall3**：Anvil 内置已知地址。Sepolia 已部署：`0xcA11bde05977b3631167028862bE2a173976CA11`。
4. **RPC 端点需支持 authorizationList**：Anvil 和主流提供商（Alchemy、Infura）支持 Prague 兼容链。
5. **会话密钥签名格式**：委托合约的 `isValidSignature` 需知道是哪个会话密钥签名。采用 `(sessionKey, ecdsaSig)` 紧凑编码。

---

## 依赖版本锁定（2026-06）

| Package | Version |
|---------|---------|
| next | ^16.2.9 |
| react / react-dom | ^19.2.0 |
| typescript | ^5.7 |
| wagmi | ^3.6.17 |
| viem | ^2.53.1 |
| @tanstack/react-query | ^5.x |
| tailwindcss | ^4.x |
| lucide-react | latest |
| next-themes | latest |
| solc (Foundry) | 0.8.28 |

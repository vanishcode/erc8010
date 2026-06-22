import type { Translations } from "../types";

export const zh: Translations = {
  common: {
    copy: "复制",
    copied: "已复制",
    pending: "待处理",
    done: "完成",
    valid: "有效 ✓",
    failed: "失败 ✗",
    loading: "加载中...",
    network: "网络",
  },
  navbar: {
    home: "首页",
    demo: "演示",
    explain: "原理",
  },
  home: {
    badge: "ERC-8010 草案",
    title: "预委托签名验证",
    subtitle:
      "在委托交易上链之前即可验证 EIP-7702 签名。ERC-8010 将您的签名与授权打包，让验证者以原子方式模拟委托。",
    tryDemo: "体验演示",
    howItWorks: "工作原理",
    whatIsTitle: "什么是 ERC-8010？",
    problemTitle: "问题",
    problemDesc:
      "EIP-7702 允许 EOA 委托到智能合约。但对于在委托上链之前签署的消息呢？标准 ERC-1271 和 ERC-6492 无法验证它们。",
    solutionTitle: "解决方案",
    solutionDesc:
      "ERC-8010 定义了一个签名包装格式，将内部签名与 EIP-7702 授权打包在一起。末尾的 32 字节 MAGIC 标记让验证者能够检测到它。",
    flowTitle: "流程",
    flowDesc:
      "签名 → 包装 → 链下验证（通过模拟委托）→ 链上委托 → 再次验证（通过真实委托）。相同的签名，相同的结果。",
    formatTitle: "ERC-8010 包装格式",
    verificationTitle: "验证路径",
    preDelegationBadge: "委托前",
    preDelegationTitle: "ERC-8010 路径",
    preDelegationDesc:
      "viem 检测到 MAGIC 标记 → 提取授权 → 通过 eth_call 配合授权列表模拟委托 → 原子调用 isValidSignature。",
    postDelegationBadge: "委托后",
    postDelegationTitle: "ERC-1271 路径",
    postDelegationDesc:
      "viem 检测到链上已存在委托（0xef0100...）→ 直接调用 isValidSignature。无需模拟。",
    ctaTitle: "尝试一下？",
    ctaDesc:
      "使用预设账户签署消息，用 ERC-8010 包装，然后验证——不到一分钟即可完成。",
    ctaButton: "开始演示",
    footer: "构建于",
  },
  demo: {
    title: "ERC-8010 演示",
    subtitle: "逐步体验完整的预委托签名验证流程。",
    networkLabel: "网络：",
    steps: [
      { id: 1, label: "签署消息" },
      { id: 2, label: "ERC-8010 包装" },
      { id: 3, label: "链下验证" },
      { id: 4, label: "链上委托" },
      { id: 5, label: "委托后验证" },
    ],
    notConfiguredTitle: "演示账户未配置",
    notConfiguredDesc1: "请在 .env 中设置",
    notConfiguredDesc2: "以开始演示。",
    step1Title: "步骤 1：签署消息",
    step1Desc:
      "使用预设账户签署一条消息。此签名稍后将由委托合约进行验证。",
    messageLabel: "要签署的消息",
    signatureLabel: "ECDSA 签名（inner_signature）",
    signButton: "签署消息",
    signedButton: "已签署 ✓",
    step2Title: "步骤 2：使用 ERC-8010 包装",
    step2Desc:
      "使用预设账户签署 EIP-7702 授权，并构建 ERC-8010 包装签名：inner_sig || context || context_len || MAGIC。",
    authLabel: "EIP-7702 授权",
    wrappedLabel: "ERC-8010 包装签名",
    wrapButton: "签署授权并包装",
    wrappedButton: "已包装 ✓",
    step3Title: "步骤 3：链下验证（委托前）",
    step3Desc:
      "使用 viem 的 verifyHash 验证包装签名。它会自动检测 MAGIC 标记，并通过 eth_call 模拟委托。",
    simulatingText: "正在模拟委托并验证签名...",
    verifiedTitle: "签名通过 ERC-8010 验证",
    verifiedDesc:
      "viem 检测到 MAGIC 标记，提取了授权，通过 eth_call 模拟委托，并调用了 isValidSignature——全部以原子方式完成。无需链上交易。",
    failedTitle: "验证失败",
    failedDesc:
      "签名无法验证。请检查委托合约是否已部署，以及会话密钥是否已授权。",
    reverify: "重新验证",
    verifyOffChain: "链下验证",
    step4Title: "步骤 4：执行链上委托",
    step4Desc:
      "发送包含 EIP-7702 授权列表的 type-4 交易。这将 EOA 的代码设置为 0xef0100 || delegate。",
    sendingText: "正在发送委托交易...",
    executedTitle: "委托已执行",
    viewExplorer: "在浏览器中查看",
    executeDelegation: "执行委托",
    delegatedButton: "已委托 ✓",
    step5Title: "步骤 5：委托后验证",
    step5Desc:
      "再次验证同一个包装签名。现在委托已在链上，viem 检测到委托代码并直接使用 ERC-1271——无需模拟。",
    verifyingText: "正在对已委托账户验证签名...",
    stillValidTitle: "签名仍然有效！",
    stillValidDesc:
      "完全相同的包装签名在委托后仍然通过验证。唯一的区别是 viem 采用的路径：委托前使用 ERC-8010 模拟，委托后直接使用 ERC-1271。",
    failedPostTitle: "验证失败",
    verifyPostDelegate: "委托后验证",
    completeTitle: "演示完成！",
    completeDesc:
      "ERC-8010 确保签名在委托前后都能正常工作。同一个包装签名在两种场景下都能成功验证，viem 会自动检测正确的验证路径。",
    comparisonTitle: "对比：纯 ECDSA 恢复",
    comparisonDesc:
      "最基础的验证方式：使用 recoverAddress 从哈希+签名中恢复签名者的公钥。100% 链下——无需 RPC、无需合约、无需委托。与上述 ERC-8010 和 ERC-1271 路径进行对比。",
    recoveringText: "正在从签名中恢复签名者地址...",
    ecdsaSuccessTitle: "ECDSA 恢复成功",
    ecdsaSuccessDesc:
      "恢复出的签名者地址与演示账户匹配。这确认了消息是由预期的私钥签署的——完全不需要链上交互。",
    ecdsaFailedTitle: "ECDSA 恢复失败",
    ecdsaFailedDesc:
      "恢复出的地址与演示账户不匹配。签名可能已损坏或由其他密钥签署。",
    verifyEcdsa: "使用 ECDSA 恢复验证",
    aspect: "维度",
    path: "路径",
    method: "方法",
    onChain: "链上？",
    verifies: "验证内容",
    result: "结果",
    ecdsaPath: "原生 ECDSA",
    erc8010Path: "ERC-8010",
    erc1271Path: "ERC-1271",
    ecdsaMethod: "recoverAddress（链下）",
    erc8010Method: "eth_call + 授权列表（模拟）",
    erc1271Method: "直接调用 isValidSignature",
    ecdsaOnChain: "否（0 次 RPC 调用）",
    erc8010OnChain: "模拟（1 次 eth_call）",
    erc1271OnChain: "是（1 次 eth_call）",
    ecdsaVerifies: "签名者 = 账户持有者",
    erc8010Verifies: "如果委托，账户将接受签名",
    erc1271Verifies: "已委托账户接受签名",
    preDelegation: "委托前",
    postDelegation: "委托后",
    toast: {
      chainSwitched: (name: string) => `已切换到 ${name}`,
      accountNotConfigured:
        "演示账户未配置。请在 .env 中设置 NEXT_PUBLIC_DEMO_PRIVATE_KEY",
      messageSigned: "消息已签署",
      signingFailed: (msg: string) => `签署失败：${msg}`,
      missingSig: "缺少签名或钱包",
      walletNotAvailable:
        "钱包客户端不可用。请检查 NEXT_PUBLIC_DEMO_PRIVATE_KEY。",
      signatureWrapped: "签名已使用 ERC-8010 包装",
      wrappingFailed: (msg: string) => `包装失败：${msg}`,
      verifiedSimulation: "签名通过 ERC-8010 模拟验证",
      verificationFailed: "验证失败",
      verificationError: (msg: string) => `验证错误：${msg}`,
      delegationExecuted: "委托已在链上执行",
      delegationFailed: (msg: string) => `委托失败：${msg}`,
      stillValid: "相同的签名，委托后仍然有效！",
      postVerifyFailed: "委托后验证失败",
      ecdsaVerified: "ECDSA 恢复已验证——签名者与演示账户匹配",
      ecdsaFailed: "ECDSA 恢复失败——恢复的地址不匹配",
      ecdsaError: (msg: string) => `ECDSA 恢复错误：${msg}`,
      copied: (label: string) => `${label} 已复制`,
    },
  },
  explain: {
    title: "ERC-8010 工作原理",
    subtitle: "深入了解签名包装格式和验证流程。",
    formatTitle: "签名包装格式",
    innerSigTitle: "inner_signature",
    innerSigDesc:
      "原始 ECDSA 签名（或委托合约期望的任何格式）。通常为 65 字节。",
    contextTitle: "context",
    contextDesc: "ABI 编码元组：(authorization, init_to, init_data)",
    contextItem1:
      "authorization：EIP-7702 签名授权元组（chain_id, address, nonce, yParity, r, s）",
    contextItem2: "init_to：（可选）初始化合约地址",
    contextItem3: "init_data：（可选）初始化调用数据",
    lengthTitle: "context_length",
    lengthDesc:
      "4 字节，uint32 大端序。context 的字节长度。用于确定 context 结束和 MAGIC 开始的位置。",
    magicTitle: "MAGIC",
    magicDesc: "32 字节常量：",
    verificationTitle: "验证流程",
    standardsTitle: "相关标准",
    eip7702Title: "EIP-7702 — 设置 EOA 账户代码",
    eip7702Content1:
      "EIP-7702 新增了一种交易类型，允许 EOA 在单笔交易中为自己的地址设置代码。该代码是一个委托标识：0xef0100 || address（23 字节）。当 EOA 被调用时，它会 delegatecall 到指定的实现合约。",
    eip7702Content2:
      "这是 ERC-8010 的基础——没有 EIP-7702，就没有需要验证的预委托签名。",
    erc1271Title: "ERC-1271 — 标准签名验证",
    erc1271Content1:
      "ERC-1271 定义了 isValidSignature(bytes32 hash, bytes signature) → bytes4 接口。委托合约必须实现此接口，以便验证者可以检查针对已委托 EOA 的签名。",
    erc1271Content2:
      "ERC-8010 在模拟委托后调用 isValidSignature 以获取最终验证结果。",
    erc6492Title: "ERC-6492 — 预部署签名验证",
    erc6492Content1:
      "ERC-6492 处理将通过 CREATE2 部署但尚未存在的合约的签名。当未检测到 MAGIC 标记时，ERC-8010 将委托给 ERC-6492 作为回退方案。",
    erc6492Content2:
      "ERC-6492 + ERC-8010 + ERC-1271 + 原生 EOA 验证共同构成了一个通用的签名验证管道。",
    viemTitle: "viem — 内置 ERC-8010 支持",
    viemContent:
      "viem（由 ERC-8010 的主要作者 @jxom 开发）对 ERC-8010 提供了一流支持。verifyHash 和 verifyTypedData 操作会自动检测 ERC-8010 包装签名，并执行上述完整的验证流程。",
  },
};

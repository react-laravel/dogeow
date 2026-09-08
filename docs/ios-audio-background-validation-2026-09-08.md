# iPhone 可视化与锁屏播放复核

## 结论与范围

“iPhone 开启可视化就一定不能锁屏播放”不是适用于所有版本的结论。WebKit 已实现音乐播放会话下的 Web Audio 后台播放，但其历史上也出现过系统版本和主屏幕网页应用特有的回归。

本次修复了项目主动切换播放器造成停顿的路径。**尚未完成真实 iPhone 锁屏听感验证，因此保留播放模式设置，iPhone/iPad 的自动模式仍使用原生播放。不能把本次桌面验证表述为 iPhone 已实现无感连续播放。**

## 代码发现与修复

- 之前的可视化链路是 `<audio> → MediaElementAudioSource → Analyser → Gain → destination`，没有使用设置文案中描述的 `captureStream`。
- 旧逻辑在页面隐藏时创建第二条播放链路，复制进度、播放、关闭原 AudioContext，再重建原 `<audio>`；恢复时还会先暂停接管音频。这些操作需要加载和定位，无法保证无缝。
- 新逻辑在创建 AudioContext 前尝试设置 `navigator.audioSession.type = 'playback'`，保留已有的 `play-and-record`。不支持或拒绝设置时不会阻止播放。
- 桌面浏览器，以及接受 `playback` / `play-and-record` 会话的浏览器，不再因为页面隐藏或恢复而进行接管、暂停、加载、定位或重建音频链路。
- 旧版 iOS 强制可视化模式仍保留兼容接管。这条路径不承诺无感。修复其恢复条件：接管后原 Web Audio 已拆除，解锁恢复不能再要求原链路仍存在。
- 删除不符合实际代码的 `captureStream` 说明，明确自动模式在 iPhone/iPad 上的行为。

## 已执行验证

- 播放器、启动台、设置和音乐状态相关测试：22 个文件、93 项通过。
- 完整 TypeScript 检查、修改文件 ESLint、Prettier 和差异空白检查通过。
- `npm run build -- --webpack` 通过。默认 Turbopack 构建在此环境中因创建进程/绑定端口被拒绝而失败，没有修改项目构建配置。
- 本机 WebKit 26.5（Playwright WebKit 2358），使用实际 `useAudioManager` 和频谱组件播放本地生成的 WAV，成功建立 `playback` 会话并得到非零频谱数据。
- WebKit 的 iPhone 15 页面模拟配置不是真实 iPhone。切换到测试工具创建的另一个页面时，原页面 `document.hidden` 仍为 `false`，因此该结果不作为后台或锁屏证据。
- 随后在播放和频谱稳定后，向实际 WebKit 播放器注入隐藏/恢复事件：隐藏 10 秒期间进度从 2.013 秒到 12.020 秒，恢复后到 13.026 秒；AudioContext 始终为 `running`，频谱保持非零，播放器重建次数为 0，接管音频没有来源，没有记录到 `pause`、`load`、`waiting` 或 `seeking`。这证明该代码路径没有主动切换或暂停，不模拟 iOS 系统的锁屏调度。
- 单元测试覆盖隐藏/恢复过程中不调用 `pause`、`load`、接管播放或重建，覆盖会话设置失败、旧 iOS 兼容路径，以及拆除 Web Audio 后恢复失败时保留接管播放器。

## 仍需 iPhone 实测

本机设备列表里的 iPhone 当前为不可连接状态。需要在更新后的项目上记录 iOS 版本以及入口（Safari 标签页 / 从主屏幕打开的网页应用），分别验证：

1. 选择“可视化优先”，刷新页面后开始播放，确认频谱随歌曲变化。
2. 播放中手动锁屏至少 60 秒，持续听取声音，不能出现哪怕短暂的静音、重复片段或进度跳变。
3. 解锁后确认频谱恢复、声音不中断，重复至少 5 次；再分别测试自动锁屏和切换到其他应用。
4. 锁屏状态下跨越歌曲结尾，并测试系统播放/暂停及切歌按钮。
5. 如果平时从主屏幕打开网页应用，单独重复上述步骤，不能用 Safari 标签页的结果代替。

只有这些场景在目标设备上通过，才适合移除设置并扩大自动启用可视化的范围。

## 一手依据

- [WebKit 261554：playback 会话下 AudioContext 后台暂停，已修复](https://bugs.webkit.org/show_bug.cgi?id=261554)。修复合入于 2024-03-01；报告中后续确认部分问题在 iOS 17.5 得到解决，不能由此推断所有后续版本和入口均无问题。
- [对应 WebKit 实现](https://github.com/WebKit/WebKit/commit/b848143a2ad5)：后台播放豁免检查 Audio Session 类型，补充 Now Playing 和远程控制处理。
- [W3C Audio Session 草案](https://w3c.github.io/audio-session/)：AudioContext 默认类型为 `ambient`，HTMLMediaElement 默认类型为 `playback`。
- [WebKit 291892：主屏幕网页应用恢复后 Web Audio 静音的报告](https://bugs.webkit.org/show_bug.cgi?id=291892)：说明仍需区分系统版本和运行入口，不能用桌面或模拟器结果替代真机。

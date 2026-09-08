# iPhone 锁屏与自动切歌修复记录

## 用户复测后的修正

用户报告锁屏后仍会切到兼容播放；歌曲结束后歌名变成下一首，但播放暂停，点击播放仍听到上一首。第一次修复保留了不支持 Audio Session 时的双播放器接管，未解决这条路径的问题。本轮已彻底移除自动接管。

- 始终使用同一个 `<audio>`。删除备用播放器、锁屏进度快照、拆除并重建 AudioContext 的逻辑。页面隐藏不会改变所选模式、音源或播放器。
- 开启可视化时继续尝试声明 `navigator.audioSession.type = 'playback'`，保留已有的 `play-and-record`。接口不可用也不会自动换到另一个播放器。
- 切歌先同步更新实际音源，再更新歌名，并在切歌事件内立即请求播放。React 后续更新不会重复加载。点击播放时也核对真实 `src`，不能只依赖可能过期的 `dataset` 标记。
- 忽略换源、歌曲结束产生的暂停事件；取消上一首的延迟暂停回调，并在回调执行前核对当前音源和真实播放状态。
- 对等待中的播放请求记录音源版本。用户再次切歌或暂停后，旧的恢复、重试和错误处理不能覆盖新选择。
- 只有一首歌的播放列表也会重新播放，不依赖歌名改变触发 React 更新。

播放设置仍保留。iPhone/iPad 的“自动”模式在最初开始播放时使用原生音频；用户明确选择“可视化优先”后，锁屏不会再自动接管到原生音频。设置并未被程序改写。

## 验证结果

- 播放器、启动台、设置和音乐状态相关测试共 22 个文件、98 项通过，覆盖自动下一首、暂停后继续当前曲、过期音源标记、旧暂停事件晚到、下一首缓冲较慢、单曲列表循环、iPhone 无 Audio Session 时保持同一音频链路，以及恢复音频上下文期间用户暂停。
- 完整 TypeScript 检查、修改文件 ESLint、Prettier 和差异空白检查通过。
- 使用 `npm run build -- --webpack` 验证生产构建。上轮默认 Turbopack 在此环境因创建进程/绑定端口被拒绝，未修改项目构建配置。
- 使用本机 WebKit 26.5 / Playwright WebKit 2358 的 iPhone 15 页面配置，导入项目实际 `useAudioManager`、`useLauncherPlayback` 与频谱组件，播放两首本地生成的 WAV。第一首实际结束后，标题为“第二首”、实际来源为 `/api/musics/second.wav`，`paused=false`、`isPlaying=true`。点击暂停后两者变为 `true/false`，再次播放仍使用第二首音源。
- 向实际 WebKit 页面注入隐藏事件后，保持一个音频元素、同一个分析节点、`visualizer` 模式以及非零频谱，没有调用暂停、加载或重新播放。该检查只验证代码生命周期，不模拟 iOS 的系统锁屏调度。

## 真机验证边界

本轮没有完成真实 iPhone 锁屏听感验收。上轮本机设备列表中的 iPhone 为不可连接状态。不能将 WebKit 页面模拟或注入隐藏事件称为“iPhone 锁屏已无感连续播放”。

WebKit 已实现音乐播放会话下的 Web Audio 后台播放，但历史上有系统版本及主屏幕网页应用特有的回归。移除自动切换可以避免项目主动打断音频，不能保证所有 iOS 版本都允许 Web Audio 持续在后台运行。

在更新后的项目上记录 iOS 版本与入口（Safari 标签页 / 从主屏幕打开的网页应用），检查：

1. 选择“可视化优先”，刷新后开始播放，确认频谱随歌曲变化。
2. 手动锁屏至少 60 秒，持续听取声音，检查是否有短暂停顿、重复片段或进度跳变。
3. 解锁确认频谱仍在，并连续重复 5 次；再测试自动锁屏和切换到其他应用。
4. 前台与锁屏时分别跨越歌曲结尾，核对下一首歌名和实际声音；暂停后继续应仍是当前曲。
5. 如果使用主屏幕网页应用，单独重复，不能用 Safari 标签页的结果代替。

只有目标设备的这些场景通过，才适合移除播放设置或扩大自动启用可视化的范围。

## 一手依据

- [WebKit 261554：playback 会话下 AudioContext 后台暂停，已修复](https://bugs.webkit.org/show_bug.cgi?id=261554)。
- [对应 WebKit 实现](https://github.com/WebKit/WebKit/commit/b848143a2ad5)：后台播放豁免检查 Audio Session 类型，补充 Now Playing 和远程控制处理。
- [W3C Audio Session 草案](https://w3c.github.io/audio-session/)：AudioContext 默认类型为 `ambient`，HTMLMediaElement 默认类型为 `playback`。
- [WebKit 291892：主屏幕网页应用恢复后 Web Audio 静音的报告](https://bugs.webkit.org/show_bug.cgi?id=291892)。

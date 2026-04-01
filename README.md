# 定段赛备战大屏

一个适合智力运动学校局域网部署的定段赛倒计时大屏。老师只需要打开展示页网址并按 `F11` 全屏即可使用。

## 功能

- 局域网网页访问
- 自动刷新当前时间
- 自动计算定段赛剩余天数
- 随机轮换励志语
- 本地配置页，无需登录
- 配置保存在 `data/config.json`

## 启动

```bash
npm install
npm start
```

默认端口是 `3000`，默认监听 `0.0.0.0`，适合局域网访问。

## 地址

- 展示页：`http://服务器IP:3000/`
- 配置页：`http://服务器IP:3000/config`

## 部署建议

1. 将服务器电脑设置为固定局域网 IP。
2. 在系统防火墙中放行 `3000` 端口。
3. 把展示页地址发给老师。
4. 教室电脑打开后按 `F11` 全屏。
5. 如需更省事，可以在教室电脑桌面创建展示页快捷方式。

## Render 一键部署

这个项目可以直接部署到 Render。

### 方法一：从 Git 仓库导入

1. 把项目推到 GitHub。
2. 打开 [Render Dashboard](https://dashboard.render.com/)。
3. 选择 `New +` -> `Blueprint` 或 `Web Service`。
4. 连接你的 GitHub 仓库。
5. 如果识别到仓库里的 `render.yaml`，直接确认部署即可。
6. 部署完成后，Render 会给你一个公网地址，例如：
   `https://danding-screen.onrender.com`
7. 如果你希望配置页修改能长期保存，在 Render 服务里补一个环境变量：
   `DATABASE_URL=你的 Postgres 连接串`

### 方法二：手动创建 Web Service

如果你不用 `render.yaml`，也可以手动填写：

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/healthz`

### 稳定保存配置

如果只是演示，什么都不用配，项目会直接使用仓库里的默认配置启动。

如果你要长期稳定在线使用，请一定配置 `DATABASE_URL`。推荐做法：

1. 注册一个免费的 Postgres 服务，例如 [Neon](https://neon.com/)。
2. 创建数据库。
3. 复制连接串。
4. 在 Render 的环境变量里新增：

```text
DATABASE_URL=postgres://...
```

### 重要说明

当前项目已经支持两种配置存储方式：

- 配置了 `DATABASE_URL`：使用 Postgres，适合长期稳定运行
- 没配置 `DATABASE_URL`：使用本地文件 `data/config.json`，适合本地或临时演示

如果你部署到免费平台但没有配置数据库，那么运行时修改的配置仍可能在重启或重新部署后丢失。这意味着：

- 平台重启、重新部署、实例重建后，运行时修改的配置可能丢失
- 如果你要长期稳定在线使用，后续最好把配置改成数据库或外部存储

所以最终稳定方案是：`Render Web Service + 免费 Postgres DATABASE_URL`。

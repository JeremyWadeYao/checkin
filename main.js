// 注意：因为 package.json 中 "type": "module"，所以使用 import/export 语法

const glados = async () => {
  const cookie = process.env.GLADOS
  if (!cookie) {
    console.log('❌ GLADOS_COOKIE 未配置')
    return ['❌ 签到失败', '未配置 Cookie', '']
  }
  
  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.rocks/console/checkin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'content-type': 'application/json'
    }
    
    console.log('📡 正在签到...')
    
    // 签到请求
    const checkin = await fetch('https://glados.rocks/api/user/checkin', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ token: "glados.network" })
    }).then((r) => r.json())
    
    console.log('签到响应:', checkin)
    
    // 获取用户状态
    const status = await fetch('https://glados.rocks/api/user/status', {
      method: 'GET',
      headers: headers,
    }).then((r) => r.json())
    
    console.log('状态响应:', status)
    
    // 检查 Cookie 是否有效
    if (status.code !== 0) {
      return ['❌ 签到失败', 'Cookie 无效或已过期', '请重新获取 Cookie']
    }
    
    const leftDays = Number(status.data?.leftDays || 0)
    const checkinCode = checkin.code
    let checkinMsg = checkin.message || ''
    
    // 解析签到结果
    let resultMsg = ''
    if (checkinCode === 0) {
      const points = checkin.data?.point || 0
      resultMsg = `✅ 签到成功！获得 ${points} 积分`
    } else if (checkinCode === -1) {
      resultMsg = `⚠️ 今日已签到`
    } else {
      resultMsg = `❌ 签到失败：${checkinMsg}`
    }
    
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    
    return [
      'GLaDOS 签到通知',
      resultMsg,
      `📅 时间：${now}`,
      `💎 剩余天数：${leftDays} 天`,
      `🔗 [查看详情](https://glados.rocks/console/checkin)`
    ]
  } catch (error) {
    console.error('签到错误:', error)
    return [
      '❌ GLaDOS 签到异常',
      `错误：${error.message}`,
      `请检查网络或 Cookie 是否有效`
    ]
  }
}

const notify = async (contents) => {
  const token = process.env.NOTIFY
  if (!token || !contents) {
    console.log('⚠️ NOTIFY 未配置，跳过推送')
    return
  }
  
  try {
    console.log('📤 发送 PushPlus 通知...')
    const response = await fetch('https://www.pushplus.plus/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: token,
        title: contents[0],
        content: contents.join('\n\n'),
        template: 'markdown',
      }),
    })
    const result = await response.json()
    if (result.code === 200) {
      console.log('✅ 推送成功')
    } else {
      console.log('❌ 推送失败:', result.msg)
    }
  } catch (error) {
    console.error('推送失败:', error)
  }
}

const main = async () => {
  console.log('🚀 GLaDOS 签到脚本启动')
  console.log(`⏰ 执行时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
  
  const result = await glados()
  console.log('\n📝 签到结果:')
  console.log(result.join('\n'))
  
  await notify(result)
  console.log('✅ 执行完成')
}

// ES module 方式执行
main().catch(console.error)

// 或者使用立即执行函数
// ;(async () => {
//   await main()
// })()

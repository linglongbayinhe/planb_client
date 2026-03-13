'use strict';
const crypto = require('crypto'); // 可能用于生成自定义 token
const uniID = require('uni-id-common')

exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event)
	
  const { code } = event;
  if (!code) {
    return { code: 1, message: '缺少 code' };
  }

  // 1. 配置你的小程序 appid 和 secret (从微信公众平台获取)
  const appid = 'wx8e293e6f73b4fe8b'; // 请替换为真实值
  const secret = 'b3846247b9984887f9955d0fdfc70e63'; // 请替换为真实值，注意保密！

  // 2. 微信接口地址
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

  try {
    // 3. 云函数中可以使用 uniCloud.httpclient 发起请求
    const res = await uniCloud.httpclient.request(url, {
      dataType: 'json',
      method: 'GET'
    });
    const resData = res.data; // 包含 openid, session_key, unionid(可选)

    // 4. 检查微信接口返回的异常
    if (resData.errcode) {
      console.error('微信接口错误', resData);
      return { code: 2, message: '微信登录失败', error: resData };
    }

    const { openid, session_key, unionid } = resData;

    // 重要：不要将 session_key 返回给前端！

    // 5. 根据 openid 处理用户数据（在 uni-cloud 数据库中）
    const db = uniCloud.database();
    const users = db.collection('users'); // 假设你有一个 users 集合

    let user = await users.where({ openid: openid }).get();
    let userInfo;
    if (user.data && user.data.length > 0) {
      // 用户已存在，更新登录信息（例如最后登录时间）
      userInfo = user.data[0];
      // 可以在此更新 session_key 用于后续解密敏感信息，但注意安全
      await users.doc(userInfo._id).update({
        last_login_time: Date.now(),
        session_key: session_key // 如果后续需要解密手机号等，可以存储（务必保证云函数安全）
      });
    } else {
      // 新用户，创建记录
      userInfo = {
        openid: openid,
        unionid: unionid || '',
        created_time: Date.now(),
        last_login_time: Date.now(),
        session_key: session_key // 按需存储
      };
      const addRes = await users.add(userInfo);
      userInfo._id = addRes.id; // 获取生成的 _id
    }

    // 6. 生成自定义登录态（例如简单的 token）
    // 真实项目中建议使用更安全的方法，如 jwt
    const token = crypto.createHash('md5').update(openid + Date.now()).digest('hex');

    // 7. 返回自定义登录态和部分用户信息（不要返回 openid 和 session_key）
    return {
      code: 0,
      message: 'success',
      token: token,
      userInfo: {
        // 只返回必要的非敏感信息
        _id: userInfo._id,
        // 可以返回其他如昵称、头像等（如果你后续有更新用户信息的话）
      }
    };

  } catch (error) {
    console.error('云函数执行异常', error);
    return { code: 3, message: '服务器内部错误' };
  }
};
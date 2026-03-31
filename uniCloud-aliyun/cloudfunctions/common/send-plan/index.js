'use strict'

const MAX_EMAILS = 3
const MAX_PHONES = 3
const MAX_DISPLAY_NAME = 100
const MAX_MESSAGE = 500
const MAX_TIME_SKEW_MS = 60 * 1000

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^1[3-9]\d{9}$/

const TASK_COLLECTION = 'plan_send_tasks'
const TASK_CHANNEL_EMAIL = 'email'
const TASK_CHANNEL_SMS = 'sms'
const TASK_STATUS_PENDING = 'pending'
const DEFAULT_MAX_ATTEMPTS = 3
const TASK_RELATED_FIELDS = new Set([
  'send_emails',
  'send_phones',
  'send_display_name',
  'send_message',
  'enable_sending',
  'send_time'
])

function makeError(errCode, errMsg) {
  return { errCode, errMsg }
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeExistingEmailList(list) {
  if (!Array.isArray(list)) return []
  return list.map(item => String(item).trim().toLowerCase()).filter(Boolean)
}

function normalizeExistingPhoneList(list) {
  if (!Array.isArray(list)) return []
  return list.map(item => String(item).trim()).filter(Boolean)
}

function normalizeEmailInput(email) {
  const value = trimString(email).toLowerCase()
  if (!value) {
    return makeError('PARAM_INVALID', '邮箱不能为空')
  }
  if (!EMAIL_RE.test(value)) {
    return makeError('PARAM_INVALID', '邮箱格式无效')
  }
  return { value }
}

function normalizePhoneInput(phone) {
  const value = trimString(phone)
  if (!value) {
    return makeError('PARAM_INVALID', '手机号不能为空')
  }
  if (!PHONE_RE.test(value)) {
    return makeError('PARAM_INVALID', '手机号格式无效')
  }
  return { value }
}

function normalizeEmailList(list) {
  if (!Array.isArray(list)) {
    return makeError('PARAM_INVALID', 'emails 必须是数组')
  }
  const seen = new Set()
  const result = []
  for (const item of list) {
    const normalized = normalizeEmailInput(item)
    if (normalized.errCode) return normalized
    if (!seen.has(normalized.value)) {
      seen.add(normalized.value)
      result.push(normalized.value)
    }
  }
  if (result.length > MAX_EMAILS) {
    return makeError('MAX_EMAILS', `最多只能添加 ${MAX_EMAILS} 个邮箱`)
  }
  return { value: result }
}

function normalizePhoneList(list) {
  if (!Array.isArray(list)) {
    return makeError('PARAM_INVALID', 'phones 必须是数组')
  }
  const seen = new Set()
  const result = []
  for (const item of list) {
    const normalized = normalizePhoneInput(item)
    if (normalized.errCode) return normalized
    if (!seen.has(normalized.value)) {
      seen.add(normalized.value)
      result.push(normalized.value)
    }
  }
  if (result.length > MAX_PHONES) {
    return makeError('MAX_PHONES', `最多只能添加 ${MAX_PHONES} 个手机号`)
  }
  return { value: result }
}

function normalizeDisplayName(value) {
  const text = value == null ? '' : trimString(String(value))
  if (text.length > MAX_DISPLAY_NAME) {
    return makeError('PARAM_INVALID', `displayName 不能超过 ${MAX_DISPLAY_NAME} 个字符`)
  }
  return { value: text }
}

function normalizeCustomGuide(value) {
  const text = value == null ? '' : trimString(String(value))
  if (text.length > MAX_MESSAGE) {
    return makeError('PARAM_INVALID', `通知正文不能超过 ${MAX_MESSAGE} 个字符`)
  }
  return { value: text }
}

function normalizeSendDate(value) {
  if (typeof value !== 'number' || !isFinite(value) || value <= 0) {
    return makeError('PARAM_INVALID', 'sendDate 必须是有效的毫秒时间戳')
  }
  if (value < Date.now() - MAX_TIME_SKEW_MS) {
    return makeError('PARAM_INVALID', 'sendDate 不能早于当前时间')
  }
  return { value: Math.floor(value) }
}

function pickTaskRelatedFields(updateData) {
  return Object.keys(updateData || {}).filter(key => TASK_RELATED_FIELDS.has(key))
}

function makeTaskId(uid, channel) {
  return `${uid}:${channel}`
}

function getTaskCollection(db) {
  return db.collection(TASK_COLLECTION)
}

function getDocFromRes(res) {
  return (res && res.data && res.data[0]) || null
}

function normalizeTaskEmailRecipients(list) {
  return normalizeExistingEmailList(list)
}

function normalizeTaskPhoneRecipients(list) {
  return normalizeExistingPhoneList(list)
}

function isActiveProcessingTask(task, now) {
  if (!task || task.status !== 'processing') return false
  return Number(task.lock_expire_at || 0) > now
}

function buildTaskDoc(user, channel, now) {
  if (!user || !user._id) return null
  if (user.enable_sending !== true) return null

  const dueAt = Number(user.send_time || 0)
  if (!isFinite(dueAt) || dueAt <= 0) return null

  const displayName = trimString(user.send_display_name || '')
  const message = trimString(user.send_message || '')
  if (!displayName || !message) return null

  const recipients = channel === TASK_CHANNEL_EMAIL
    ? normalizeTaskEmailRecipients(user.send_emails)
    : normalizeTaskPhoneRecipients(user.send_phones)

  if (recipients.length === 0) return null

  return {
    _id: makeTaskId(user._id, channel),
    uid: user._id,
    channel,
    status: TASK_STATUS_PENDING,
    due_at: dueAt,
    next_retry_at: dueAt,
    attempt_count: 0,
    max_attempts: DEFAULT_MAX_ATTEMPTS,
    recipients,
    display_name: displayName,
    message,
    template_data: {
      send_display_name: displayName,
      send_message: message
    },
    lock_token: '',
    lock_expire_at: 0,
    last_error: '',
    last_sent_at: 0,
    updated_at: now
  }
}

function stripTaskId(taskDoc) {
  const copy = Object.assign({}, taskDoc)
  delete copy._id
  return copy
}

function createSendPlanService(ctx) {
  let uniId = null
  try {
    const uniIdCommon = require('uni-id-common')
    const clientInfo = ctx && typeof ctx.getClientInfo === 'function' ? ctx.getClientInfo() : {}
    uniId = uniIdCommon.createInstance({ clientInfo })
  } catch (e) {
    uniId = null
  }

  async function resolveUid(uid) {
    let resolvedUid = trimString(uid)
    if (resolvedUid) return resolvedUid

    if (uniId && ctx && typeof ctx.getUniIdToken === 'function') {
      const token = ctx.getUniIdToken()
      if (token) {
        try {
          const payload = await uniId.checkToken(token)
          if (payload && payload.uid) {
            resolvedUid = trimString(payload.uid)
          }
        } catch (e) {}
      }
    }

    return resolvedUid
  }

  function getDb() {
    return uniCloud.database()
  }

  async function loadUser(uid) {
    const db = getDb()
    const docRes = await db.collection('uni-id-users').doc(uid).get()
    const user = (docRes && docRes.data && docRes.data[0]) || null
    return user
  }

  async function loadTask(taskId) {
    const db = getDb()
    return getDocFromRes(await getTaskCollection(db).doc(taskId).get())
  }

  async function saveTaskDoc(taskDoc, now) {
    const db = getDb()
    const tasks = getTaskCollection(db)
    const existing = await loadTask(taskDoc._id)
    if (isActiveProcessingTask(existing, now)) {
      return { skipped: true, reason: 'TASK_PROCESSING' }
    }

    if (existing) {
      await tasks.doc(taskDoc._id).update(stripTaskId(taskDoc))
    } else {
      await tasks.add(taskDoc)
    }

    return { success: true }
  }

  async function removeTaskDoc(taskId, now) {
    const db = getDb()
    const task = await loadTask(taskId)
    if (!task) {
      return { success: true, removed: false }
    }
    if (isActiveProcessingTask(task, now)) {
      return { skipped: true, reason: 'TASK_PROCESSING' }
    }

    await getTaskCollection(db).doc(taskId).remove()
    return { success: true, removed: true }
  }

  async function syncPlanTasks(uid) {
    const now = Date.now()
    const user = await loadUser(uid)
    if (!user) {
      throw new Error('USER_NOT_FOUND')
    }

    const emailTask = buildTaskDoc(user, TASK_CHANNEL_EMAIL, now)
    const smsTask = buildTaskDoc(user, TASK_CHANNEL_SMS, now)

    if (emailTask) {
      await saveTaskDoc(emailTask, now)
    } else {
      await removeTaskDoc(makeTaskId(uid, TASK_CHANNEL_EMAIL), now)
    }

    if (smsTask) {
      await saveTaskDoc(smsTask, now)
    } else {
      await removeTaskDoc(makeTaskId(uid, TASK_CHANNEL_SMS), now)
    }
  }

  async function updateUser(uid, updateData) {
    const user = await loadUser(uid)
    if (!user) {
      return makeError('USER_NOT_FOUND', '用户不存在')
    }

    const keys = Object.keys(updateData || {})
    if (!keys.length) {
      return makeError('PARAM_INVALID', '没有可更新的字段')
    }

    const db = getDb()
    await db.collection('uni-id-users').doc(uid).update(updateData)
    if (pickTaskRelatedFields(updateData).length > 0) {
      await syncPlanTasks(uid)
    }
    return { success: true }
  }

  function buildPatchFromInput(patch) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return makeError('PARAM_INVALID', 'patch 必须是对象')
    }

    const updateData = {}

    if (Object.prototype.hasOwnProperty.call(patch, 'emails')) {
      const normalized = normalizeEmailList(patch.emails)
      if (normalized.errCode) return normalized
      updateData.send_emails = normalized.value
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'phones')) {
      const normalized = normalizePhoneList(patch.phones)
      if (normalized.errCode) return normalized
      updateData.send_phones = normalized.value
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'displayName')) {
      const normalized = normalizeDisplayName(patch.displayName)
      if (normalized.errCode) return normalized
      updateData.send_display_name = normalized.value
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'customGuide')) {
      const normalized = normalizeCustomGuide(patch.customGuide)
      if (normalized.errCode) return normalized
      updateData.send_message = normalized.value
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'enabled')) {
      if (typeof patch.enabled !== 'boolean') {
        return makeError('PARAM_INVALID', 'enabled 必须是布尔值')
      }
      updateData.enable_sending = patch.enabled
    }

    if (Object.prototype.hasOwnProperty.call(patch, 'sendDate')) {
      const normalized = normalizeSendDate(patch.sendDate)
      if (normalized.errCode) return normalized
      updateData.send_time = normalized.value
    }

    if (!Object.keys(updateData).length) {
      return makeError('PARAM_INVALID', '没有可更新的字段')
    }

    return { value: updateData }
  }

  async function savePlan(patch, uid) {
    const built = buildPatchFromInput(patch)
    if (built.errCode) return built

    const resolvedUid = await resolveUid(uid)
    if (!resolvedUid) {
      return makeError('UID_REQUIRED', '请先登录后再操作')
    }

    try {
      return await updateUser(resolvedUid, built.value)
    } catch (e) {
      return makeError('DB_ERROR', e && e.message ? e.message : '更新失败')
    }
  }

  async function updateSendEmail(email, isNew, uid) {
    const normalizedEmail = normalizeEmailInput(email)
    if (normalizedEmail.errCode) return normalizedEmail
    if (typeof isNew !== 'boolean') {
      return makeError('PARAM_INVALID', 'isNew 必须是布尔值')
    }

    const resolvedUid = await resolveUid(uid)
    if (!resolvedUid) {
      return makeError('UID_REQUIRED', '请先登录后再操作')
    }

    try {
      const user = await loadUser(resolvedUid)
      if (!user) {
        return makeError('USER_NOT_FOUND', '用户不存在')
      }

      let list = normalizeExistingEmailList(user.send_emails)
      if (isNew) {
        if (list.includes(normalizedEmail.value)) return { success: true }
        if (list.length >= MAX_EMAILS) {
          return makeError('MAX_EMAILS', `最多只能添加 ${MAX_EMAILS} 个邮箱`)
        }
        list = [...list, normalizedEmail.value]
      } else {
        list = list.filter(item => item !== normalizedEmail.value)
      }

      return await updateUser(resolvedUid, { send_emails: list })
    } catch (e) {
      return makeError('DB_ERROR', e && e.message ? e.message : '更新失败')
    }
  }

  async function updateSendPhone(phone, isNew, uid) {
    const normalizedPhone = normalizePhoneInput(phone)
    if (normalizedPhone.errCode) return normalizedPhone
    if (typeof isNew !== 'boolean') {
      return makeError('PARAM_INVALID', 'isNew 必须是布尔值')
    }

    const resolvedUid = await resolveUid(uid)
    if (!resolvedUid) {
      return makeError('UID_REQUIRED', '请先登录后再操作')
    }

    try {
      const user = await loadUser(resolvedUid)
      if (!user) {
        return makeError('USER_NOT_FOUND', '用户不存在')
      }

      let list = normalizeExistingPhoneList(user.send_phones)
      if (isNew) {
        if (list.includes(normalizedPhone.value)) return { success: true }
        if (list.length >= MAX_PHONES) {
          return makeError('MAX_PHONES', `最多只能添加 ${MAX_PHONES} 个手机号`)
        }
        list = [...list, normalizedPhone.value]
      } else {
        list = list.filter(item => item !== normalizedPhone.value)
      }

      return await updateUser(resolvedUid, { send_phones: list })
    } catch (e) {
      return makeError('DB_ERROR', e && e.message ? e.message : '更新失败')
    }
  }

  async function updateSendMessage(displayName, message, uid) {
    const normalizedDisplayName = normalizeDisplayName(displayName)
    if (normalizedDisplayName.errCode) return normalizedDisplayName
    const normalizedMessage = normalizeCustomGuide(message)
    if (normalizedMessage.errCode) return normalizedMessage

    const resolvedUid = await resolveUid(uid)
    if (!resolvedUid) {
      return makeError('UID_REQUIRED', '请先登录后再操作')
    }

    try {
      return await updateUser(resolvedUid, {
        send_display_name: normalizedDisplayName.value,
        send_message: normalizedMessage.value
      })
    } catch (e) {
      return makeError('DB_ERROR', e && e.message ? e.message : '更新失败')
    }
  }

  async function setEnableSending(enableSending, uid) {
    if (typeof enableSending !== 'boolean') {
      return makeError('PARAM_INVALID', 'enable_sending 必须是布尔值')
    }

    const resolvedUid = await resolveUid(uid)
    if (!resolvedUid) {
      return makeError('UID_REQUIRED', '请先登录后再操作')
    }

    try {
      return await updateUser(resolvedUid, { enable_sending: enableSending })
    } catch (e) {
      return makeError('DB_ERROR', e && e.message ? e.message : '更新失败')
    }
  }

  async function updateSendTime(sendDate, uid) {
    const normalizedSendDate = normalizeSendDate(sendDate)
    if (normalizedSendDate.errCode) return normalizedSendDate

    const resolvedUid = await resolveUid(uid)
    if (!resolvedUid) {
      return makeError('UID_REQUIRED', '请先登录后再操作')
    }

    try {
      return await updateUser(resolvedUid, { send_time: normalizedSendDate.value })
    } catch (e) {
      return makeError('DB_ERROR', e && e.message ? e.message : '更新失败')
    }
  }

  return {
    savePlan,
    updateSendEmail,
    updateSendPhone,
    updateSendMessage,
    setEnableSending,
    updateSendTime
  }
}

module.exports = {
  createSendPlanService
}

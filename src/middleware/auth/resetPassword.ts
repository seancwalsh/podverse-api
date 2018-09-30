import { getUserByEmail, updateUser } from 'controllers/user'
import { emitRouterError } from "lib/errors";
import { sendResetPasswordEmail } from 'services/auth/sendResetPasswordEmail'
const addSeconds = require('date-fns/add_seconds')
const uuidv4 = require('uuid/v4')


export const sendResetPassword = async ctx => {
  const { email } = ctx.request.body

  try {
    const { id, name } = await getUserByEmail(email)

    const resetPasswordToken = uuidv4()
    const resetPasswordTokenExpiration = addSeconds(new Date(), process.env.RESET_PASSWORD_TOKEN_EXPIRATION)

    await updateUser({
      id,
      resetPasswordToken,
      resetPasswordTokenExpiration
    })

    await sendResetPasswordEmail(email, name, resetPasswordToken)
    
    ctx.body = 'Reset password email sent!'
    ctx.status = 200
  } catch (error) {
    emitRouterError(error, ctx)
  }
}
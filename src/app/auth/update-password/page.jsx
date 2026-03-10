import { AuthLayout } from '@/components/auth/AuthLayout'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export const metadata = { title: 'Update Password — ChatSync' }

export default function UpdatePasswordPage() {
  return (
    <AuthLayout>
      <UpdatePasswordForm />
    </AuthLayout>
  )
}

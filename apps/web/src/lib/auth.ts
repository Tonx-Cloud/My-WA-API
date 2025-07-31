import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Chamar API backend para autenticação
          const response = await fetch(`${process.env['NEXT_PUBLIC_API_URL']}/api/nextauth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            return null
          }

          const result = await response.json()

          if (result.user) {
            return {
              id: result.user.id.toString(),
              email: result.user.email,
              name: result.user.name,
              image: result.user.avatar_url,
            }
          }

          return null
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }

      // Para login OAuth (Google)
      if (account?.provider === 'google') {
        try {
          // Chamar API backend para criar/atualizar usuário OAuth
          const response = await fetch(`${process.env['NEXT_PUBLIC_API_URL']}/api/nextauth/oauth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              provider: 'google',
              provider_id: account.providerAccountId,
              email: user.email,
              name: user.name,
              avatar_url: user.image,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.user) {
              token.id = result.user.id.toString()
            }
          }
        } catch (error) {
          console.error('Erro no callback OAuth:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env['NEXTAUTH_SECRET'] || 'fallback-secret-for-development',
}


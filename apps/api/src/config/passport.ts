import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserModel, CreateUserData } from '../models/User';
import logger from './logger';

// Função de inicialização do Passport
export function initializePassport() {
  // Verificar se as credenciais do Google OAuth estão definidas
  const googleClientId = process.env['GOOGLE_CLIENT_ID'];
  const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  console.log('DEBUG - Google OAuth Config:');
  console.log('CLIENT_ID:', googleClientId);
  console.log('CLIENT_SECRET:', googleClientSecret ? '[DEFINIDO]' : '[NÃO DEFINIDO]');

  if (
    googleClientId &&
    googleClientSecret &&
    googleClientId !== 'your-google-client-id-replace-this' &&
    googleClientSecret !== 'your-google-client-secret-replace-this'
  ) {
    console.log('✅ Configurando Google OAuth Strategy...');

    // Configuração da estratégia Google OAuth
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: 'http://localhost:3000/api/auth/google/callback',
          scope: ['profile', 'email'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            logger.info(`Tentativa de login OAuth Google: ${profile.emails?.[0]?.value}`);

            // Verificar se usuário já existe por email
            const existingUser = await UserModel.findByEmail(profile.emails?.[0]?.value);

            if (existingUser) {
              // Se usuário já existe, atualizar informações do provider se necessário
              if (existingUser.provider !== 'google' || existingUser.provider_id !== profile.id) {
                await UserModel.update(existingUser.id!, {
                  provider: 'google',
                  provider_id: profile.id,
                  avatar_url: profile.photos?.[0]?.value,
                });
              }

              logger.info(`Login OAuth Google realizado: ${existingUser.email}`);
              return done(null, existingUser);
            }

            // Verificar se já existe um usuário com este provider_id
            const existingProviderUser = await UserModel.findByProvider('google', profile.id);
            if (existingProviderUser) {
              logger.info(
                `Login OAuth Google realizado via provider_id: ${existingProviderUser.email}`
              );
              return done(null, existingProviderUser);
            }

            // Criar novo usuário
            const userData: CreateUserData = {
              email: profile.emails?.[0]?.value || '',
              password: '', // Senha vazia para OAuth users
              name: profile.displayName || 'Usuário Google',
              provider: 'google',
              provider_id: profile.id,
              avatar_url: profile.photos?.[0]?.value,
            };

            const newUser = await UserModel.create(userData);

            logger.info(`Novo usuário OAuth Google criado: ${newUser.email}`);

            // Marcar como novo usuário para redirecionamento especial
            (newUser as any).isNewUser = true;

            return done(null, newUser);
          } catch (error) {
            logger.error('Erro na autenticação OAuth Google:', error);
            return done(error, null);
          }
        }
      )
    );

    // Serialização do usuário para sessão
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    // Deserialização do usuário da sessão
    passport.deserializeUser(async (id: number, done) => {
      try {
        const user = await UserModel.findById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  } else {
    logger.warn(
      '⚠️  Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env'
    );
  }
}

export default passport;

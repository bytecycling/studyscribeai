import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  english: {
    translation: {
      nav: {
        signIn: 'Sign In',
        getStarted: 'Get Started',
        history: 'History',
        signOut: 'Sign Out',
        profile: 'Profile'
      },
      hero: {
        title: 'StudyScribe.AI',
        subtitle: 'Transform YouTube videos, audio files, and PDFs into comprehensive study notes. Create flashcards, take quizzes, and chat with AI about your content.',
        cta: 'Get Started Free',
        demo: 'View Demo'
      },
      features: {
        title: 'Features',
        // Add more feature translations
      },
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        welcomeBack: 'Welcome Back',
        createAccount: 'Create Account',
        email: 'Email',
        password: 'Password',
        fullName: 'Full Name',
        continueWithGoogle: 'Continue with Google',
        continueWithEmail: 'Continue with Email'
      }
    }
  },
  español: {
    translation: {
      nav: {
        signIn: 'Iniciar Sesión',
        getStarted: 'Comenzar',
        history: 'Historial',
        signOut: 'Cerrar Sesión',
        profile: 'Perfil'
      },
      hero: {
        title: 'StudyScribe.AI',
        subtitle: 'Transforma videos de YouTube, archivos de audio y PDFs en notas de estudio completas. Crea tarjetas de memoria, realiza cuestionarios y chatea con IA sobre tu contenido.',
        cta: 'Comenzar Gratis',
        demo: 'Ver Demo'
      },
      auth: {
        signIn: 'Iniciar Sesión',
        signUp: 'Registrarse',
        welcomeBack: 'Bienvenido de Nuevo',
        createAccount: 'Crear Cuenta',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        fullName: 'Nombre Completo',
        continueWithGoogle: 'Continuar con Google',
        continueWithEmail: 'Continuar con Correo'
      }
    }
  },
  français: {
    translation: {
      nav: {
        signIn: 'Se Connecter',
        getStarted: 'Commencer',
        history: 'Historique',
        signOut: 'Se Déconnecter',
        profile: 'Profil'
      },
      hero: {
        title: 'StudyScribe.AI',
        subtitle: 'Transformez des vidéos YouTube, des fichiers audio et des PDF en notes d\'étude complètes. Créez des cartes mémoire, passez des quiz et discutez avec l\'IA sur votre contenu.',
        cta: 'Commencer Gratuitement',
        demo: 'Voir la Démo'
      },
      auth: {
        signIn: 'Se Connecter',
        signUp: 'S\'inscrire',
        welcomeBack: 'Bon Retour',
        createAccount: 'Créer un Compte',
        email: 'Email',
        password: 'Mot de Passe',
        fullName: 'Nom Complet',
        continueWithGoogle: 'Continuer avec Google',
        continueWithEmail: 'Continuer avec Email'
      }
    }
  },
  '中文': {
    translation: {
      nav: {
        signIn: '登录',
        getStarted: '开始使用',
        history: '历史记录',
        signOut: '登出',
        profile: '个人资料'
      },
      hero: {
        title: 'StudyScribe.AI',
        subtitle: '将YouTube视频、音频文件和PDF转换为全面的学习笔记。创建闪卡、进行测验，并与AI讨论您的内容。',
        cta: '免费开始',
        demo: '查看演示'
      },
      auth: {
        signIn: '登录',
        signUp: '注册',
        welcomeBack: '欢迎回来',
        createAccount: '创建账户',
        email: '电子邮件',
        password: '密码',
        fullName: '全名',
        continueWithGoogle: '使用Google继续',
        continueWithEmail: '使用电子邮件继续'
      }
    }
  },
  '日本語': {
    translation: {
      nav: {
        signIn: 'サインイン',
        getStarted: '始める',
        history: '履歴',
        signOut: 'サインアウト',
        profile: 'プロフィール'
      },
      hero: {
        title: 'StudyScribe.AI',
        subtitle: 'YouTubeビデオ、オーディオファイル、PDFを包括的な学習ノートに変換します。フラッシュカードを作成し、クイズを受け、AIとコンテンツについて話し合います。',
        cta: '無料で始める',
        demo: 'デモを見る'
      },
      auth: {
        signIn: 'サインイン',
        signUp: 'サインアップ',
        welcomeBack: 'お帰りなさい',
        createAccount: 'アカウント作成',
        email: 'メール',
        password: 'パスワード',
        fullName: '氏名',
        continueWithGoogle: 'Googleで続ける',
        continueWithEmail: 'メールで続ける'
      }
    }
  },
  'bahasa melayu': {
    translation: {
      nav: {
        signIn: 'Log Masuk',
        getStarted: 'Mulakan',
        history: 'Sejarah',
        signOut: 'Log Keluar',
        profile: 'Profil'
      },
      hero: {
        title: 'StudyScribe.AI',
        subtitle: 'Tukar video YouTube, fail audio, dan PDF kepada nota pembelajaran yang komprehensif. Cipta kad imbas, ambil kuiz, dan berbual dengan AI tentang kandungan anda.',
        cta: 'Mulakan Percuma',
        demo: 'Lihat Demo'
      },
      auth: {
        signIn: 'Log Masuk',
        signUp: 'Daftar',
        welcomeBack: 'Selamat Kembali',
        createAccount: 'Buat Akaun',
        email: 'Emel',
        password: 'Kata Laluan',
        fullName: 'Nama Penuh',
        continueWithGoogle: 'Teruskan dengan Google',
        continueWithEmail: 'Teruskan dengan Emel'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'english',
    fallbackLng: 'english',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

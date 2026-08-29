import { Fraunces, Inter, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from 'next/font/google'

export const fraunces = Fraunces({ subsets: ['latin'], weight: ['600'], variable: '--font-fraunces', display: 'swap' })
export const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' })
export const notoSansDev = Noto_Sans_Devanagari({ subsets: ['devanagari', 'latin'], weight: ['400', '500', '600'], variable: '--font-noto-sans-dev', display: 'swap' })
export const notoSerifDev = Noto_Serif_Devanagari({ subsets: ['devanagari', 'latin'], weight: ['600', '700'], variable: '--font-noto-serif-dev', display: 'swap' })

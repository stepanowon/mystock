import { z } from 'zod'

export const addHoldingSchema = z.object({
  symbol: z
    .string()
    .min(1, '종목 코드를 입력해주세요')
    .refine((val) => /^[A-Za-z0-9^.]+$/.test(val), {
      message: '종목 코드는 영문·숫자만 입력 가능합니다 (예: 005930, AAPL)',
    }),
  name: z.string().min(1, '종목명을 입력해주세요'),
  market: z.enum(['KRX', 'NYSE', 'NASDAQ']),
  currency: z.enum(['KRW', 'USD']),
  avgPrice: z.number().positive('매수가는 0보다 커야 합니다'),
  quantity: z.number().int().positive('수량은 1 이상이어야 합니다'),
})

export type AddHoldingFormData = z.infer<typeof addHoldingSchema>

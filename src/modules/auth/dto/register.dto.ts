import {z} from 'zod';

export const RegisterSchema = z.object({
    email: z.string().email({message: 'Invalid email address'}),
    password: z.string().min(8, {message: 'Password must be at least 8 characters long'}),
})

export type RegisterDto = z.infer<typeof RegisterSchema>
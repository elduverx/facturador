sed -i '' -e 's/enum PaymentTargetType {/enum PaymentTargetType {\n  PAYMENT_LINK/' prisma/schema.prisma

cat << 'EOS' >> prisma/schema.prisma

model PaymentLink {
  id          String        @id @default(cuid())
  reference   String?       @unique // "orden"
  concept     String
  amount      Float
  clientName  String
  clientEmail String
  clientPhone String
  status      PaymentStatus @default(PENDING)
  paymentId   String?       @unique
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([clientEmail])
  @@index([status])
}
EOS

npx prisma format

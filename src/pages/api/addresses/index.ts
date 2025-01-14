import type { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth/next"

import Xata from "@/lib/xata"
import { authOptions } from "../auth/[...nextauth]"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user) {
    res.status(401).json({ error: "Unauthenticated" })
    return
  }

  const email = session.user.email

  const user = await Xata.auth.db.nextauth_users.filter({ email }).getFirst()

  if (!user) {
    res.status(500).json({ error: "Server Authentication Error" })
    return
  }

  const customer = await Xata.shop.db.customer
    .filter("user", user.id)
    .getFirst()

  if (!customer) {
    res.status(500).json({ error: "Server Authentication Error" })
    return
  }

  switch (req.method) {
    case "POST": {
      const { departamento, provincia, distrito, direccion, referencias } =
        req.body

      const address = await Xata.shop.db.address.create({
        customer: customer.id,
        departamento,
        provincia,
        distrito,
        direccion,
        referencias,
      })

      if (!address) {
        res.status(500).json({ error: "Server Error" })
        return
      }

      res.status(200).json({ success: true })
      break
    }
    case "GET": {
      const addresses = await Xata.shop.db.address
        .filter("customer", customer.id)
        .getAll()

      res.status(200).json({ success: true, addresses })
      break
    }

    default: {
      res.status(405).json({ error: "Method not allowed" })
      break
    }
  }
}

export default handler

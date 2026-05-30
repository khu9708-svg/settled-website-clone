import Image from "next/image"

export function Founder() {
  return (
    <section className="w-full">
      <Image
        src="/images/founders-message.png"
        alt="A message from Kevin Hunter, founder of SETTLED"
        width={1200}
        height={800}
        className="w-full"
        style={{ height: "auto", display: "block" }}
        priority
      />
    </section>
  )
}

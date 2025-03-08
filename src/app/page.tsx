import Image from "next/image";
import logo from '@public/images/task-hive-logo.png';
import { InputCustom } from "./componets/inputCustom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-[url('../../public/images/bg-1.png')] bg-cover">
      <main className="flex flex-col gap-4 backdrop-blur-xl bg-[rgba(0,0,0,0.03)] h-screen w-screen">
        <header className="p-4">
          <Image src={logo} alt="Logo" width={80} height={80} />
        </header>

        <div className="flex items-center justify-center w-full h-fit">
          <section className="gap-4 flex flex-col backdrop-blur-xl bg-[rgba(17,17,17,.6)] p-8 rounded-3xl overflow-hidden">
            <h1 className="text-5xl font-bold text-white">Task Hive</h1>
            <p className="text-2xl text-white">Bem vindo ao Task Hive</p>

            <form className="flex flex-col gap-2 w-full max-w-md">
              <label htmlFor="email" className="text-white">Email</label>
              <InputCustom id="email" type="email" placeholder="email@email.com" />

              <label htmlFor="password" className="text-white">Senha</label>
              <InputCustom id="password" type="password" placeholder="********" isPassword={true} isShowing={false} />

              <button type="submit" className="bg-violet-900 rounded-lg p-2 text-white">Entrar</button>
            </form>
          </section>

        </div>
      </main>
    </div>
  );
}

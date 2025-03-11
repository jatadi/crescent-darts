import Image from "next/image";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Crescent Darts</h1>
      <div className="grid gap-4 max-w-md mx-auto">
        <a
          href="/game/new"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded text-center"
        >
          New Game
        </a>
        <a
          href="/players"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded text-center"
        >
          Players
        </a>
        <a
          href="/history"
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded text-center"
        >
          History
        </a>
      </div>
    </div>
  );
}

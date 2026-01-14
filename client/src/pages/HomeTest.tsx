// Simple test page to debug rendering
export default function HomeTest() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-white mb-4">JAKSEL</h1>
      <h2 className="text-4xl font-bold text-[#9333EA] mb-8">TAKEOVER</h2>
      <p className="text-gray-400">If you can see this, basic rendering works.</p>
      <button className="mt-8 px-6 py-3 bg-[#9333EA] text-black font-bold">
        TEST BUTTON
      </button>
    </div>
  );
}

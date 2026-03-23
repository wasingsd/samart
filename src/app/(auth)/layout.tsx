export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0F1F] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00B4D8] rounded-full blur-[150px] opacity-20 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2D9C5A] rounded-full blur-[150px] opacity-20 animate-pulse pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center flex-col items-center">
          <div className="h-16 w-16 bg-gradient-to-tr from-[#1A237E] to-[#00B4D8] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20 transform transition-transform hover:scale-105 duration-300">
            <span className="text-3xl font-bold text-white">P</span>
          </div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-display">
            SAMART
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            AI สมองธุรกิจสำหรับร้านค้าของคุณ
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#131B2F]/80 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-3xl sm:px-10 border border-white/5 mx-4 sm:mx-0 transition-all duration-300 hover:shadow-cyan-900/20">
          {children}
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500 relative z-10">
        &copy; {new Date().getFullYear()} SAMART. All rights reserved.
      </div>
    </div>
  );
}

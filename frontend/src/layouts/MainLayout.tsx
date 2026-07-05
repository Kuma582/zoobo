import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar.tsx';
import BottomNav from '../components/common/BottomNav.tsx';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#050505] flex justify-center w-full">
      <div className="flex flex-col min-h-screen w-full max-w-md bg-cyber-black relative border-x border-white/5 shadow-2xl overflow-x-hidden pb-20">
        <Navbar />
        <main className="flex-grow pt-16">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default MainLayout;

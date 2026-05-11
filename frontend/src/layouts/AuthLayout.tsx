import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950"
            style={{
                backgroundImage: 'url("/auth-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark Overlay for better contrast */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] -z-10"></div>
            
            {/* Floating glass elements for depth */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] -z-10"></div>

            <div className="w-full relative z-10">
                <Outlet />
            </div>
        </div>
    );
}

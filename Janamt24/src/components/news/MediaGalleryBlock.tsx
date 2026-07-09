import { Play, Camera, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

// Mock Data
const mediaItems = [
  {
    id: 1,
    type: 'video',
    title: 'রাজধানীতে তীব্র যানজট, ভোগান্তিতে সাধারণ মানুষ',
    image: 'https://images.unsplash.com/photo-1596420542171-8bc4e6e6a142?auto=format&fit=crop&q=80',
    duration: '৩:৪৫',
  },
  {
    id: 2,
    type: 'photo',
    title: 'বইমেলায় উপচে পড়া ভিড়: ছবিতে দেখুন',
    image: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&q=80',
    count: '১২',
  },
  {
    id: 3,
    type: 'video',
    title: 'খুব শীঘ্রই আসছে নতুন প্রযুক্তি',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80',
    duration: '১:২০',
  },
  {
    id: 4,
    type: 'photo',
    title: 'গ্রাম বাংলার অপরূপ প্রাকৃতিক দৃশ্য',
    image: 'https://images.unsplash.com/photo-1601625463687-25eaebbc910a?auto=format&fit=crop&q=80',
    count: '৮',
  }
];

export function MediaGalleryBlock() {
  const mainItem = mediaItems[0];
  const sideItems = mediaItems.slice(1);

  return (
    <div className="bg-slate-950 text-white p-6 my-8 border-y-4 border-primary">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
        <Camera className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-black uppercase tracking-wider">ছবি ও ভিডিও</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main large item */}
        <div className="lg:col-span-2 group cursor-pointer">
          <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden mb-4">
            <img 
              src={mainItem.image} 
              alt={mainItem.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Play button */}
            {mainItem.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </div>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4">
               <span className="flex items-center w-fit gap-1 text-[11px] font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 mb-2">
                 {mainItem.type === 'video' ? <Play className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                 {mainItem.type === 'video' ? mainItem.duration : `${mainItem.count} ছবি`}
               </span>
               <h3 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                 {mainItem.title}
               </h3>
            </div>
          </div>
        </div>

        {/* Side smaller items */}
        <div className="flex flex-col gap-6">
          {sideItems.map(item => (
            <div key={item.id} className="group cursor-pointer grid grid-cols-3 gap-4">
              <div className="col-span-1 relative aspect-square bg-slate-900 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  {item.type === 'video' ? (
                    <Play className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-white drop-shadow-md" />
                  )}
                </div>
              </div>
              <div className="col-span-2 flex flex-col justify-center">
                 <h4 className="font-bold text-[15px] leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-3">
                   {item.title}
                 </h4>
                 <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                   {item.type === 'video' ? <Play className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                   {item.type === 'video' ? item.duration : `${item.count} ছবি`}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center mt-6 pt-6 border-t border-slate-800">
        <Link to="#" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
          সব ছবি ও ভিডিও দেখুন
        </Link>
      </div>
    </div>
  );
}

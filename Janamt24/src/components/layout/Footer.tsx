import { Link } from "react-router-dom";
import { Facebook, Youtube, Mail, Phone, MapPin, ChevronRight, Newspaper, Heart } from "lucide-react";
import { toBanglaNumber } from "@/lib/bangla-utils";
import logo from "@/assets/logo.png";
interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FooterProps {
  categories?: Category[];
}

export function Footer({ categories = [] }: FooterProps) {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t-[8px] border-primary mt-20">
      <div className="container mx-auto px-4 md:px-6 pt-16 pb-8">
        
        {/* Top Centered Section: Brand & Socials */}
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <img alt="জনমত ২৪" className="h-[60px] md:h-[72px] w-auto object-contain mb-5 dark:brightness-0 dark:invert" src={logo} />
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-widest mb-2">জনমত <span className="text-primary">২৪</span></h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold tracking-[0.2em] uppercase mb-8">
            সত্য প্রচার আমাদের অঙ্গীকার
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="https://www.facebook.com/janamat247" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all shadow-sm hover:shadow-lg hover:-translate-y-1" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://www.youtube.com/@Janamat247" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] transition-all shadow-sm hover:shadow-lg hover:-translate-y-1" aria-label="YouTube">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="mailto:ifilmbd2025@gmail.com" className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1" aria-label="Email">
              <Mail className="w-5 h-5" />
            </a>
            <a href="tel:+8801712004052" className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm hover:shadow-lg hover:-translate-y-1" aria-label="Phone">
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 border-t border-b border-slate-200 dark:border-slate-800 py-12 mb-8">
          
          {/* Column 1 */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-[15px]">প্রধান বিভাগ</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">প্রচ্ছদ</Link>
              </li>
              <li>
                <Link to="/category/all" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">সব সংবাদ</Link>
              </li>
              {categories.slice(0, 3).map(category => (
                <li key={category.id}>
                  <Link to={`/category/${category.slug}`} className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-[15px]">অন্যান্য বিভাগ</h3>
            <ul className="space-y-4">
              {categories.slice(3, 8).map(category => (
                <li key={category.id}>
                  <Link to={`/category/${category.slug}`} className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">{category.name}</Link>
                </li>
              ))}
              <li>
                <Link to="/bookmarks" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">সংরক্ষিত সংবাদ</Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-[15px]">প্রতিষ্ঠান</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">আমাদের সম্পর্কে</Link>
              </li>
              <li>
                <Link to="/editorial-policy" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">সম্পাদকীয় নীতি</Link>
              </li>
              <li>
                <Link to="/corrections-policy" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">সংশোধনী নীতি</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">গোপনীয়তা নীতি</Link>
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-[15px]">কর্পোরেট</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/advertise" className="text-[15px] font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors">বিজ্ঞাপন মূল্য তালিকা</Link>
              </li>
              <li>
                <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">যোগাযোগ: <a href="tel:+8801712004052" className="hover:text-primary">+88 01712-004052</a></span>
              </li>
              <li>
                <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                  ঠিকানা:
                  <span className="text-sm">আয়েশা মঞ্জিল, দক্ষিণ সানারপাড়া, ২ নম্বর গলি, পুলিশ মোড়, ডেমরা, ঢাকা–১৩৬১</span>
                </span>
              </li>

            </ul>
          </div>
        </div>

        {/* Bottom Editorial, Developer & Copyright */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 py-8 border-t border-slate-200 dark:border-slate-800 mt-8">
          {/* Editorial Info */}
          <div className="text-[14px] font-semibold text-slate-600 dark:text-slate-400 order-2 lg:order-1">
            <p>সম্পাদক ও প্রকাশক: <span className="text-slate-900 dark:text-white">জনমত ২৪ কর্তৃপক্ষ</span></p>
          </div>
          
          {/* Developer Credit - Middle */}
          <div className="text-[14px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-6 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm order-1 lg:order-2">
            <p className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
              কারিগরি সহায়তায়: <span className="text-primary">তানভীর খান</span>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 order-3 lg:order-3">
             <span>© {toBanglaNumber(new Date().getFullYear())} জনমত ২৪। সর্বস্বত্ব সংরক্ষিত।</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
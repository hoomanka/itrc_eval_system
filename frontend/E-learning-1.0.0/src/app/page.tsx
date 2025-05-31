"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-50 bg-white shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg ml-2">CC</span>
                سامانه ارزیابی
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 space-x-reverse">
              <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium">خانه</Link>
              <Link href="#services" className="text-gray-700 hover:text-blue-600 font-medium">خدمات</Link>
              <Link href="#evaluators" className="text-gray-700 hover:text-blue-600 font-medium">ارزیابان</Link>
              <Link href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium">نظرات</Link>
              <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium">مستندات</Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4 space-x-reverse">
              <Link
                href="/signin"
                className="text-blue-600 hover:text-blue-700 font-medium px-6 py-2 rounded-full border border-blue-600 hover:bg-blue-50 transition duration-200"
              >
                ورود
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-full transition duration-200"
              >
                ثبت نام
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg"
            >
              <div className="w-6 h-0.5 bg-gray-700 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-gray-700 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-gray-700"></div>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 border-t">
              <nav className="flex flex-col space-y-4">
                <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium">خانه</Link>
                <Link href="#services" className="text-gray-700 hover:text-blue-600 font-medium">خدمات</Link>
                <Link href="#evaluators" className="text-gray-700 hover:text-blue-600 font-medium">ارزیابان</Link>
                <Link href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium">نظرات</Link>
                <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium">مستندات</Link>
                <div className="flex flex-col space-y-2 pt-4">
                  <Link href="/signin" className="text-blue-600 font-medium text-center py-2">ورود</Link>
                  <Link href="/signup" className="bg-blue-600 text-white font-medium text-center py-2 rounded-lg">ثبت نام</Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="bg-orange-100 text-orange-800 text-sm font-medium px-4 py-2 rounded-full inline-block mb-6">
                30% تخفیف برای اولین ارزیابی
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                امنیت محصولات IT خود را
                <span className="text-blue-600"> تضمین کنید</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                ارزیابی و گواهی‌نامه Common Criteria برای محصولات فناوری اطلاعات از مراکز معتبر بین‌المللی.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">استاندارد بین‌المللی</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">ارزیابان مجرب</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">گواهی معتبر</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition duration-200 text-center"
                >
                  شروع ارزیابی
                </Link>
                <Link
                  href="#services"
                  className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold px-8 py-4 rounded-full text-lg transition duration-200 text-center"
                >
                  مشاهده خدمات
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl p-8 transform rotate-3">
                  <div className="bg-white rounded-2xl p-8 transform -rotate-3">
                    <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">ارزیابی CC</h3>
                        <p className="text-gray-600">گواهی Common Criteria</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted Companies */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-lg font-semibold text-gray-600 mb-8">مورد اعتماد شرکت‌های بزرگ</h3>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {[
                'پارس آنلاین', 'شاپرک', 'بانک مرکزی', 'سپاه', 'پاسارگاد', 'ایران خودرو'
              ].map((company, index) => (
                <div key={index} className="text-gray-400 font-bold text-lg">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">خدمات ارزیابی</h2>
            <div className="flex justify-center items-center gap-4">
              <span className="text-lg text-gray-600">انواع محصولات قابل ارزیابی</span>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "سیستم عامل و پایگاه داده",
                description: "ارزیابی سیستم‌های عامل، DBMS و زیرساخت‌های اصلی",
                price: "شروع از 50,000,000",
                features: ["Windows Server", "Linux", "Oracle", "SQL Server"],
                level: "EAL 1-4",
                duration: "3-6 ماه",
                image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400",
                badge: "محبوب"
              },
              {
                title: "امنیت شبکه و فایروال",
                description: "دستگاه‌های امنیت شبکه، فایروال و IDS/IPS",
                price: "شروع از 30,000,000",
                features: ["Network Firewall", "IDS/IPS", "VPN Gateway", "UTM"],
                level: "EAL 2-5",
                duration: "2-4 ماه",
                image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
                badge: "جدید"
              },
              {
                title: "رمزنگاری و PKI",
                description: "ماژول‌های رمزنگاری، HSM و زیرساخت PKI",
                price: "شروع از 80,000,000",
                features: ["HSM", "PKI System", "Smart Card", "Crypto Module"],
                level: "EAL 3-6",
                duration: "4-8 ماه",
                image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400",
                badge: "تخصصی"
              },
              {
                title: "سیستم‌های بیومتریک",
                description: "دستگاه‌های شناسایی بیومتریک و کنترل دسترسی",
                price: "شروع از 40,000,000",
                features: ["Fingerprint", "Face Recognition", "Iris Scanner", "Voice"],
                level: "EAL 2-4",
                duration: "3-5 ماه",
                image: "https://images.unsplash.com/photo-1516110833967-0b5144b80e78?w=400",
                badge: "محبوب"
              },
              {
                title: "پلتفرم‌های ابری",
                description: "خدمات ابری، ورچوال سرور و حفاظت از داده",
                price: "شروع از 60,000,000",
                features: ["Cloud Platform", "Virtual Server", "Data Protection", "Backup"],
                level: "EAL 2-5",
                duration: "4-6 ماه",
                image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400",
                badge: "جدید"
              },
              {
                title: "موبایل و IoT",
                description: "اپلیکیشن‌های موبایل، دستگاه‌های IoT و امنیت",
                price: "شروع از 35,000,000",
                features: ["Mobile App", "IoT Device", "Endpoint Security", "MDM"],
                level: "EAL 1-3",
                duration: "2-4 ماه",
                image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400",
                badge: "محبوب"
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {service.badge}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 font-medium text-sm">سطح: {service.level}</span>
                    <span className="text-gray-600 font-medium text-sm">مدت: {service.duration}</span>
                  </div>
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {service.features.slice(0, 2).map((feature, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          {feature}
                        </span>
                      ))}
                      {service.features.length > 2 && (
                        <span className="text-gray-500 text-xs">+{service.features.length - 2} مورد دیگر</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {service.price} تومان
                    </span>
                    <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition duration-200">
                      درخواست
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Evaluators */}
      <section id="evaluators" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">ارزیابان مجرب ما</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "دکتر احمد حسینی", role: "ارزیاب ارشد CC", company: "مدیر فنی ITRC", specialty: "رمزنگاری" },
              { name: "مهندس سارا محمدی", role: "متخصص امنیت شبکه", company: "ITRC", specialty: "شبکه و فایروال" },
              { name: "دکتر علی رضایی", role: "ارزیاب سیستم‌های عامل", company: "ITRC", specialty: "OS و DBMS" },
              { name: "مهندس فاطمه کریمی", role: "متخصص بیومتریک", company: "ITRC", specialty: "سیستم‌های بیومتریک" }
            ].map((evaluator, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="relative mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L18 3H6L3 7V9H4L6 19H18L20 9H21Z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{evaluator.name}</h3>
                <p className="text-gray-600 mb-1">{evaluator.role}</p>
                <p className="text-blue-600 font-medium mb-1">{evaluator.company}</p>
                <p className="text-sm text-gray-500">{evaluator.specialty}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">نظرات مشتریان</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "رضا احمدی",
                role: "مدیر فنی شرکت پارس آنلاین",
                text: "ارزیابی CC محصول ما توسط ITRC با کیفیت عالی و در زمان مقرر انجام شد. گواهی‌نامه بین‌المللی که دریافت کردیم اعتبار محصولمان را بالا برد."
              },
              {
                name: "لیلا موسوی",
                role: "مدیر محصول شرکت صنایع الکترونیک",
                text: "تیم ارزیابی ITRC بسیار حرفه‌ای و دقیق عمل کردند. فرآیند ارزیابی شفاف و استاندارد بود و راهنمایی‌های لازم را ارائه دادند."
              },
              {
                name: "کاوه صادقی",
                role: "مدیرعامل شرکت فناوری ایمن",
                text: "بهترین سرمایه‌گذاری برای محصول امنیتی ما بود. گواهی CC کیفیت و امنیت محصولمان را به مشتریان تضمین می‌کند."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full ml-4"></div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">خبرنامه</h2>
            <p className="text-xl text-blue-100 mb-8">
              برای دریافت اخبار ارزیابی‌ها، تخفیف‌ها و آپدیت‌های جدید عضو شوید
            </p>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="آدرس ایمیل شما"
                className="flex-1 px-6 py-3 rounded-full border-0 text-gray-900 placeholder-gray-500"
              />
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium transition duration-200">
                عضویت
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-6">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg ml-2">CC</span>
                سامانه ارزیابی
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">لینک‌ها</h3>
                <div className="space-y-2">
                  <Link href="#" className="block text-gray-300 hover:text-white">خانه</Link>
                  <Link href="#services" className="block text-gray-300 hover:text-white">خدمات</Link>
                  <Link href="#evaluators" className="block text-gray-300 hover:text-white">ارزیابان</Link>
                  <Link href="#testimonials" className="block text-gray-300 hover:text-white">نظرات</Link>
                  <Link href="#" className="block text-gray-300 hover:text-white">مستندات</Link>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">خدمات ارزیابی</h3>
              <div className="space-y-2">
                <Link href="#" className="block text-gray-300 hover:text-white">سیستم عامل</Link>
                <Link href="#" className="block text-gray-300 hover:text-white">امنیت شبکه</Link>
                <Link href="#" className="block text-gray-300 hover:text-white">رمزنگاری</Link>
                <Link href="#" className="block text-gray-300 hover:text-white">بیومتریک</Link>
                <Link href="#" className="block text-gray-300 hover:text-white">پلتفرم ابری</Link>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4">اطلاعات تماس</h3>
              <div className="space-y-2 text-gray-300">
                <p>مرکز تحقیقات فناوری اطلاعات ایران (ITRC)</p>
                <p>تهران، خیابان آزادی، پلاک ۱۲۳</p>
                <p>+98 21 1234 5678</p>
                <p>info@itrc-cc.ir</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-center md:text-right">
              © ۱۴۰۳ مرکز تحقیقات فناوری اطلاعات ایران. تمامی حقوق محفوظ است.
            </p>
            <div className="flex space-x-4 space-x-reverse mt-4 md:mt-0">
              <Link href="#" className="text-gray-300 hover:text-white">حریم خصوصی</Link>
              <Link href="#" className="text-gray-300 hover:text-white">قوانین و مقررات</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
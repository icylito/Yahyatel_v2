import NewBrandLogo from "./NewBrandLogo";
import { Link } from "react-router";

const Footer = () => {
    return (
        <footer className="bg-gray-50 border-t py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-1">
                        <NewBrandLogo size="sm" className="mb-4" />
                        <p className="text-gray-600 text-sm">
                            Providing world class telecommunications solutions for homes and businesses across the region.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Services</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link to="/services" className="hover:text-brand-600">Home Internet</Link></li>
                            <li><Link to="/services" className="hover:text-brand-600">Mobile Plans</Link></li>
                            <li><Link to="/services" className="hover:text-brand-600">Enterprise Solutions</Link></li>
                            <li><Link to="/services" className="hover:text-brand-600">Cloud Services</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><Link to="/about" className="hover:text-brand-600">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-brand-600">Contact</Link></li>
                            <li><Link to="/terms" className="hover:text-brand-600">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-brand-600">Help Center</a></li>
                            <li><a href="#" className="hover:text-brand-600">Network Status</a></li>
                            <li><a href="#" className="hover:text-brand-600">Billing Support</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t mt-12 pt-8 text-center text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} <span translate="no" className="notranslate">YahyaTel</span>.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

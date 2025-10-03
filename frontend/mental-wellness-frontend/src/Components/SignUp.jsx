import { SignUp } from "@clerk/clerk-react";
import { motion } from "framer-motion";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light-green to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Join Our Journey
            </h1>
            <p className="text-gray-600">
              Start your mental wellness journey with us today
            </p>
          </div>
          <SignUp 
            routing="path" 
            path="/sign-up"
            appearance={{
              elements: {
                formButtonPrimary: "bg-light-green hover:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200",
                card: "shadow-none",
                headerTitle: "text-gray-800 font-bold text-2xl",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: "border-gray-300 hover:border-light-green hover:bg-light-green hover:text-white transition-all duration-200",
                formFieldInput: "border-gray-300 focus:border-light-green focus:ring-light-green rounded-lg",
                footerActionLink: "text-light-green hover:text-green-600",
                identityPreviewText: "text-gray-600",
                formFieldLabel: "text-gray-700 font-medium"
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

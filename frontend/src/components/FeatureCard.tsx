type Props = {
  icon?: any;
  title: string;
  description: string;
  bgColor?: string;
};

export default function FeatureCard({ icon, title, description, bgColor = "bg-blue-100 dark:bg-blue-900" }: Props) {
  return (
    <div className="feature-card card-hover-effect rounded-xl p-6 h-full">
      {icon && (
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

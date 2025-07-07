import { Button } from "@/components/ui/button";

interface CategoryButtonsProps {
  onCategorySelect: (category: string) => void;
  onClearContext: () => void;
}

const categories = [
  { id: 'employment', label: 'Employment Rights' },
  { id: 'housing', label: 'Housing & Tenancy' },
  { id: 'consumer', label: 'Consumer Rights' },
  { id: 'police', label: 'Police Encounters' },
  { id: 'family', label: 'Family Law' },
  { id: 'debt', label: 'Debt & Money' },
  { id: 'benefits', label: 'Benefits & Universal Credit' },
  { id: 'health', label: 'Healthcare Rights' },
  { id: 'immigration', label: 'Immigration' },
  { id: 'criminal', label: 'Criminal Law' },
  { id: 'discrimination', label: 'Discrimination' },
  { id: 'data', label: 'Data Protection' }
];

export default function CategoryButtons({ onCategorySelect, onClearContext }: CategoryButtonsProps) {
  return (
    <div className="bg-[var(--deep-black)] px-6 py-4 flex-shrink-0 border-b border-[var(--border-gray)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Quick Topics:</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearContext}
          className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 h-auto border-gray-600"
        >
          Clear Context
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className="category-btn text-gray-200 hover:text-white px-4 py-2 h-auto text-sm transition-all duration-300 hover:-translate-y-1"
            variant="secondary"
          >
            {category.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

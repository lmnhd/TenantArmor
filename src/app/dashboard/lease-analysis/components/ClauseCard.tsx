import type { Clause as ClauseData, Issue } from '@/lib/types';

interface ClauseCardProps {
  clause: ClauseData;
}

const ClauseCard: React.FC<ClauseCardProps> = ({ clause }) => {
  return (
    <div className="mb-6 p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h3 className="text-xl font-bold text-primary mb-2">{clause.title}</h3>
      <p className="text-muted-foreground mb-3 italic">Original Text: &quot;{clause.text}&quot;</p>
      {clause.issues.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-2">Potential Issues & Recommendations:</h4>
          <ul className="list-disc pl-5 space-y-2">
            {clause.issues.map((issue: Issue, index: number) => (
              <li key={index} className={`border-l-4 p-3 rounded-r-md 
                ${issue.severity === 'High' ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 
                  issue.severity === 'Medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' : 
                  'border-green-500 bg-green-50 dark:bg-green-900/30'}`}>
                <p className="font-semibold">{issue.description}</p>
                <p className="text-sm text-muted-foreground mt-1">Recommendation: {issue.recommendation}</p>
                <p className={`text-xs font-bold mt-1 
                  ${issue.severity === 'High' ? 'text-red-700 dark:text-red-300' : 
                    issue.severity === 'Medium' ? 'text-yellow-700 dark:text-yellow-300' : 
                    'text-green-700 dark:text-green-300'}`}>
                  Severity: {issue.severity}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClauseCard; 
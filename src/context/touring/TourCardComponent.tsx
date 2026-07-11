import { CardComponentProps } from "nextstepjs";

interface CustomCardProps extends CardComponentProps {}

const CustomCard = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CustomCardProps) => {
  const handleNext = () => {
    nextStep();
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 font-nunito"
      style={{
        width: "100%",
        maxWidth: "24rem",
        minWidth: "24rem",
        zIndex: 99999,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        {step?.icon && <div className="text-2xl">{step.icon}</div>}
        <h3 className="text-xl font-bold dark:text-white">{step?.title}</h3>
      </div>

      <div className="mb-6">
        <p className="text-base dark:text-white">{step?.content}</p>
      </div>

      <div className="text-white dark:text-purple-600">{arrow}</div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 flex-1 w-full">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="w-full px-4 py-1.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded"
            >
              Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="w-full px-4 py-1.5 bg-indigo-500 text-white rounded"
          >
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
          </button>
        </div>

        <button
          type="button"
          onClick={skipTour}
          className="w-full px-4 py-1.5 text-gray-500 dark:text-gray-400"
        >
          Skip
        </button>
      </div>

      <div className="text-sm font-normal text-center text-gray-600 dark:text-gray-300 mt-2">
        Step {currentStep + 1} of {totalSteps}
      </div>
    </div>
  );
};

export { CustomCard };

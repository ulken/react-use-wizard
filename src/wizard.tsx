import * as React from 'react';

import * as logger from './logger';
import { Handler, WizardProps } from './types';
import WizardContext from './wizardContext';

const Wizard: React.FC<WizardProps> = React.memo(
  ({ header, footer, children, startIndex = 0 }) => {
    const [activeStep, setActiveStep] = React.useState(startIndex);
    const [isLoading, setIsLoading] = React.useState(false);
    const hasNextStep = React.useRef(true);
    const hasPreviousStep = React.useRef(false);
    const nextStepHandler = React.useRef<Handler>(() => {});

    hasNextStep.current =
      activeStep < React.Children.toArray(children).length - 1;
    hasPreviousStep.current = activeStep > 0;

    const goToNextStep = React.useRef(() => {
      if (hasNextStep.current) {
        setActiveStep((activeStep) => activeStep + 1);
      }
    });

    const goToPreviousStep = React.useRef(() => {
      if (hasPreviousStep.current) {
        setActiveStep((activeStep) => activeStep - 1);
      }
    });

    const goToStep = React.useRef((stepIndex: number) => {
      if (
        stepIndex >= 0 &&
        stepIndex < React.Children.toArray(children).length
      ) {
        setActiveStep(stepIndex);
      } else {
        if (__DEV__) {
          logger.log(
            'warn',
            [
              `Invalid step index [${stepIndex}] passed to 'goToStep'. `,
              `Ensure the given stepIndex is not out of boundaries.`,
            ].join(''),
          );
        }
      }
    });

    // Callback to attach the step handler
    const handleStep = React.useRef((handler: Handler) => {
      nextStepHandler.current = handler;
    });

    const doNextStep = React.useRef(async () => {
      if (hasNextStep.current && nextStepHandler.current) {
        try {
          setIsLoading(true);
          await nextStepHandler.current();
          setIsLoading(false);
          nextStepHandler.current = null;
          goToNextStep.current();
        } catch (error) {
          setIsLoading(false);
          throw error;
        }
      } else {
        goToNextStep.current();
      }
    });

    const wizardValue = React.useMemo(
      () => ({
        nextStep: doNextStep.current,
        previousStep: goToPreviousStep.current,
        handleStep: handleStep.current,
        isLoading,
        activeStep,
        isFirstStep: !hasPreviousStep.current,
        isLastStep: !hasNextStep.current,
        goToStep: goToStep.current,
      }),
      [activeStep, isLoading],
    );

    const activeStepContent = React.useMemo(() => {
      const reactChildren = React.Children.toArray(children);

      if (__DEV__) {
        // No steps passed
        if (reactChildren.length === 0) {
          logger.log(
            'warn',
            'Make sure to pass your steps as children in your <Wizard>',
          );
        }
        // The passed start index is invalid
        if (activeStep > reactChildren.length) {
          logger.log('warn', 'An invalid startIndex is passed to <Wizard>');
        }
        // Invalid header element
        if (header && !React.isValidElement(header)) {
          logger.log('error', 'Invalid header passed to <Wizard>');
        }
        // Invalid footer element
        if (footer && !React.isValidElement(footer)) {
          logger.log('error', 'Invalid footer passed to <Wizard>');
        }
      }

      return reactChildren[activeStep];
    }, [activeStep, children, header, footer]);

    return (
      <WizardContext.Provider value={wizardValue}>
        {header}
        {activeStepContent}
        {footer}
      </WizardContext.Provider>
    );
  },
);

export default Wizard;

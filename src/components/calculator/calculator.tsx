
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Divide, Minus, Plus, Equal, Percent } from 'lucide-react';

export function Calculator() {
  const [displayValue, setDisplayValue] = useState('0');
  const [firstOperand, setFirstOperand] = useState<null | number>(null);
  const [operator, setOperator] = useState<null | string>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const clearInput = () => {
    setDisplayValue('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (operator && waitingForSecondOperand)  {
      setOperator(nextOperator);
      return;
    }

    if (firstOperand === null) {
      setFirstOperand(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setDisplayValue(String(result));
      setFirstOperand(result);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };
  
  const performCalculation = () => {
    if (firstOperand === null || operator === null) return parseFloat(displayValue);
    const inputValue = parseFloat(displayValue);
    
    let result = 0;
    if (operator === '+') {
      result = firstOperand + inputValue;
    } else if (operator === '-') {
      result = firstOperand - inputValue;
    } else if (operator === '*') {
      result = firstOperand * inputValue;
    } else if (operator === '/') {
      result = firstOperand / inputValue;
    }
    
    return result;
  }
  
  const handleEquals = () => {
      if (!operator) return;
      const result = performCalculation();
      setDisplayValue(String(result));
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
  }

  const handlePlusMinus = () => {
    setDisplayValue(String(parseFloat(displayValue) * -1));
  }
  
  const handlePercent = () => {
    setDisplayValue(String(parseFloat(displayValue) / 100));
  }

  const renderButton = (label: string | React.ReactNode, onClick: () => void, className = 'bg-muted hover:bg-muted/80', textClass = 'text-foreground') => (
    <Button
      variant="outline"
      className={`h-16 text-2xl font-semibold rounded-lg transition-all duration-200 ease-in-out transform active:scale-95 ${className}`}
      onClick={onClick}
    >
      <span className={textClass}>{label}</span>
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg p-4 text-right h-20 flex items-end justify-end">
        <p className="text-5xl font-mono break-all line-clamp-1">{displayValue}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {renderButton(displayValue !== '0' ? 'C' : 'AC', clearInput, 'bg-destructive/20 hover:bg-destructive/40', 'text-destructive')}
        {renderButton('+/-', handlePlusMinus, 'bg-primary/10 hover:bg-primary/20', 'text-primary' )}
        {renderButton(<Percent size={24} />, handlePercent, 'bg-primary/10 hover:bg-primary/20', 'text-primary' )}
        {renderButton(<Divide size={24} />, () => handleOperator('/'), 'bg-primary/20 hover:bg-primary/40', 'text-primary')}
        
        {renderButton('7', () => inputDigit('7'))}
        {renderButton('8', () => inputDigit('8'))}
        {renderButton('9', () => inputDigit('9'))}
        {renderButton(<X size={24} />, () => handleOperator('*'), 'bg-primary/20 hover:bg-primary/40', 'text-primary')}
        
        {renderButton('4', () => inputDigit('4'))}
        {renderButton('5', () => inputDigit('5'))}
        {renderButton('6', () => inputDigit('6'))}
        {renderButton(<Minus size={24} />, () => handleOperator('-'), 'bg-primary/20 hover:bg-primary/40', 'text-primary')}
        
        {renderButton('1', () => inputDigit('1'))}
        {renderButton('2', () => inputDigit('2'))}
        {renderButton('3', () => inputDigit('3'))}
        {renderButton(<Plus size={24} />, () => handleOperator('+'), 'bg-primary/20 hover:bg-primary/40', 'text-primary')}

        {renderButton('0', () => inputDigit('0'), 'col-span-2')}
        {renderButton('.', inputDecimal)}
        {renderButton(<Equal size={24} />, handleEquals, 'bg-primary hover:bg-primary/90', 'text-primary-foreground')}
      </div>
    </div>
  );
}

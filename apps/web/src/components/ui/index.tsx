import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Button variants usando CVA
const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-whatsapp-500 hover:bg-whatsapp-600 text-white focus:ring-whatsapp-500',
        secondary:
          'bg-whatsapp-dark-500 hover:bg-whatsapp-dark-600 text-white focus:ring-whatsapp-dark-500',
        outline:
          'border-2 border-whatsapp-500 text-whatsapp-500 hover:bg-whatsapp-500 hover:text-white focus:ring-whatsapp-500',
        ghost: 'text-whatsapp-500 hover:bg-whatsapp-50 focus:ring-whatsapp-500',
        destructive: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
        success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
      },
      size: {
        sm: 'px-3 py-2 text-sm rounded-md',
        md: 'px-4 py-2 text-base rounded-lg',
        lg: 'px-6 py-3 text-lg rounded-lg',
        xl: 'px-8 py-4 text-xl rounded-xl',
        icon: 'p-2 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// Card component
const cardVariants = cva('bg-white border rounded-xl transition-all duration-200', {
  variants: {
    variant: {
      default: 'border-gray-200 shadow-md hover:shadow-lg',
      outlined: 'border-gray-300 shadow-sm',
      elevated: 'border-gray-100 shadow-lg hover:shadow-xl',
      flat: 'border-gray-100 shadow-none',
      whatsapp:
        'border-whatsapp-100 shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-whatsapp-50',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
});

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants({ variant, padding, className }))} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Badge component
const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-whatsapp-100 text-whatsapp-800',
        secondary: 'bg-whatsapp-dark-100 text-whatsapp-dark-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        online: 'bg-green-100 text-green-800',
        offline: 'bg-gray-100 text-gray-800',
        away: 'bg-yellow-100 text-yellow-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  pulse?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, children, pulse, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), pulse && 'animate-pulse', className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

// Avatar component
const avatarVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full bg-gray-100 overflow-hidden',
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  online?: boolean;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, online, ...props }, ref) => {
    return (
      <div className="relative">
        <div ref={ref} className={cn(avatarVariants({ size, className }))} {...props}>
          {src ? (
            <img src={src} alt={alt} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-600">{fallback || alt?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        {online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

// Status Indicator
interface StatusIndicatorProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showLabel = false,
  size = 'md',
  pulse = false,
}) => {
  const statusConfig = {
    connected: { color: 'bg-green-400', textColor: 'text-green-600', defaultLabel: 'Conectado' },
    connecting: {
      color: 'bg-yellow-400',
      textColor: 'text-yellow-600',
      defaultLabel: 'Conectando...',
    },
    disconnected: {
      color: 'bg-gray-400',
      textColor: 'text-gray-600',
      defaultLabel: 'Desconectado',
    },
    error: { color: 'bg-red-400', textColor: 'text-red-600', defaultLabel: 'Erro' },
  };

  const sizeConfig = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <div className="flex items-center space-x-2">
      <div
        className={cn(sizeConfig[size], config.color, 'rounded-full', pulse && 'animate-pulse')}
      />
      {showLabel && (
        <span className={cn('text-sm font-medium', config.textColor)}>{displayLabel}</span>
      )}
    </div>
  );
};

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeConfig = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorConfig = {
    primary: 'text-whatsapp-500',
    secondary: 'text-whatsapp-dark-500',
    white: 'text-white',
  };

  return (
    <svg
      className={cn('animate-spin', sizeConfig[size], colorConfig[color], className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Stat Card component reutilizÃ¡vel
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: string;
  realtime?: boolean;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  color = 'bg-blue-500',
  realtime = false,
  loading = false,
}) => {
  return (
    <Card variant="elevated" className="transition-all duration-200 hover:scale-105">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div
            className={cn('w-10 h-10 rounded-lg flex items-center justify-center shadow-md', color)}
          >
            {loading ? <LoadingSpinner size="sm" color="white" /> : icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</dd>
            {trend && !loading && (
              <dd className="flex items-center text-sm">
                <span
                  className={cn(
                    'font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? 'â†—' : 'â†˜'} {trend.value}%
                </span>
                <span className="text-gray-500 ml-1">{trend.label}</span>
              </dd>
            )}
          </dl>
        </div>
      </div>
      {description && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm">
            <span className="text-gray-600">{description}</span>
            {realtime && (
              <div className="flex items-center mt-1">
                <StatusIndicator status="connected" size="sm" pulse />
                <span className="text-xs text-green-600 font-medium ml-2">Tempo real</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

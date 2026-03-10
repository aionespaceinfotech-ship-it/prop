import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Modal } from './Modal';
import { X } from 'lucide-react';

interface AdaptiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const AdaptiveDrawer: React.FC<AdaptiveDrawerProps> = (props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return <Modal {...props} />;
  }

  return (
    <Drawer.Root open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[96%] flex-col rounded-t-[20px] bg-white outline-none">
          <div className="flex-1 overflow-y-auto rounded-t-[20px] p-4 bg-white">
            <div className="mx-auto mb-6 h-1.5 w-12 shrink-0 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between mb-6 px-2">
              <Drawer.Title className="text-xl font-bold text-slate-900 leading-none">
                {props.title}
              </Drawer.Title>
              <button
                onClick={props.onClose}
                className="p-2 rounded-full bg-slate-100 text-slate-500 active:scale-95 transition-transform"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-2 pb-8">
              {props.children}
              {props.footer && (
                <div className="mt-8 flex flex-col gap-3">
                  {props.footer}
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

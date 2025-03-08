'use client'

import { Eye, EyeClosed } from "lucide-react";
import React from "react";


interface IInputCustom extends React.InputHTMLAttributes<HTMLInputElement>{
  errorMessage?: string;
  isShowing?: boolean;
  isPassword?: boolean;
}

export function InputCustom({ errorMessage, isShowing = false, isPassword = false, ...props }: IInputCustom) {

  return (
    <div className="flex-1">
      <div className={"bg-gray-900 flex-1 flex justify-between items-center gap-1 rounded-lg p-2 text-white" + (errorMessage && " border-red-500") + props.className}>
        <input className={"flex-1 w-full" + props.className} {...props} />
        {isPassword && (
          <>
            {isShowing ? (
              <EyeClosed color="white" size={18} />
            ) : (
              <Eye color="white" size={18} />
            )}
          </>
        )}
      </div>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
    </div>
  )
}

"use client";

import { useState, useCallback, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ImageUploadProps {
    onFileSelect: (file: File | null) => void;
    currentImageUrl?: string | null;
}

export function ImageUpload({ onFileSelect, currentImageUrl }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setPreview(URL.createObjectURL(file));
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/gif': [],
        },
        multiple: false,
    });
    
    const handleRemoveImage = () => {
        setPreview(null);
        onFileSelect(null);
    }

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group w-full aspect-video border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors",
                    isDragActive && "border-primary bg-primary/10",
                    preview && "border-solid"
                )}
            >
                <input {...getInputProps()} />
                {preview ? (
                    <>
                        <Image src={preview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <p className="text-white text-sm">Drag or click to replace</p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage();
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <div className="text-center text-muted-foreground">
                        <ImageIcon className="mx-auto h-10 w-10" />
                        {isDragActive ? (
                            <p className="mt-2 text-sm">Drop the image here...</p>
                        ) : (
                            <p className="mt-2 text-sm">Drag 'n' drop an image here, or click to select</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

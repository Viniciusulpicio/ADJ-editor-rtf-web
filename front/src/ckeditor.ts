// src/ckeditor.ts

import { type EditorConfig, Plugin } from '@ckeditor/ckeditor5-core';
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

// Plugins essenciais
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Undo } from '@ckeditor/ckeditor5-undo';

// Plugins de estilos básicos
import { Bold, Italic } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { Table } from '@ckeditor/ckeditor5-table';

// Plugins de Imagem
import { Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload, ImageResize } from '@ckeditor/ckeditor5-image';
import { SimpleUploadAdapter } from '@ckeditor/ckeditor5-upload';

// ===== PLUGIN DE FONTE =====
import { Font } from '@ckeditor/ckeditor5-font';

export default class CustomEditor extends ClassicEditorBase {
    public static override builtinPlugins: (typeof Plugin)[] = [
        Essentials,
        Heading,
        Undo,
        Bold,
        Italic,
        BlockQuote,
        Link,
        List,
        Table,
        Image,
        ImageCaption,
        ImageStyle,
        ImageToolbar,
        ImageUpload,
        ImageResize,
        SimpleUploadAdapter,
        Font // apenas o Font
    ];


    public static override defaultConfig: EditorConfig = {
        toolbar: {
            items: [
                'heading', '|',
                'bold', 'italic', '|',
                'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', '|',
                'link', 'blockQuote', '|',
                'numberedList', 'bulletedList', '|',
                'insertTable', 'imageUpload', '|',
                'undo', 'redo'
            ]
        },

        image: {
            toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative'],
            resizeOptions: [
                { name: 'imageResize:original', value: null, icon: 'original' },
                { name: 'imageResize:50', value: '50', icon: 'medium' },
                { name: 'imageResize:75', value: '75', icon: 'large' }
            ],
        },

        fontFamily: {
            options: [
                'default',
                'Arial, Helvetica, sans-serif',
                'Courier New, Courier, monospace',
                'Georgia, serif',
                'Lucida Sans Unicode, Lucida Grande, sans-serif',
                'Tahoma, Geneva, sans-serif',
                'Times New Roman, Times, serif',
                'Trebuchet MS, Helvetica, sans-serif',
                'Verdana, Geneva, sans-serif'
            ],
            supportAllValues: true
        },

        fontSize: {
            options: [10, 12, 14, 'default', 18, 20, 22],
            supportAllValues: true
        },

        fontColor: {
            columns: 5,
            documentColors: 10
        },

        fontBackgroundColor: {
            columns: 5,
            documentColors: 10
        }
    };
}

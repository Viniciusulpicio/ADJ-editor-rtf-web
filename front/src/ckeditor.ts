// src/ckeditor.ts

import { type EditorConfig, Plugin } from '@ckeditor/ckeditor5-core';
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

// Plugins essenciais que adicionamos de volta
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Undo } from '@ckeditor/ckeditor5-undo';

// Plugins de estilos básicos
import { Bold, Italic } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { Table } from '@ckeditor/ckeditor5-table';

// ===== NOVOS PLUGINS DE IMAGEM =====
import { Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload, ImageResize } from '@ckeditor/ckeditor5-image';
import { SimpleUploadAdapter } from '@ckeditor/ckeditor5-upload';


export default class CustomEditor extends ClassicEditorBase {
    public static override builtinPlugins: (typeof Plugin)[] = [
        // Adicionamos Essentials de volta, pois é uma dependência necessária para os plugins de imagem
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
        ImageUpload,
        SimpleUploadAdapter,
        
        // ===== ADICIONAMOS OS NOVOS PLUGINS AQUI =====
        ImageCaption, 
        ImageStyle, 
        ImageToolbar, 
        ImageResize
    ];

    public static override defaultConfig: EditorConfig = {
        toolbar: {
            items: [
                'heading', '|',
                'bold', 'italic', 'link', 'blockQuote', '|',
                'numberedList', 'bulletedList', '|',
                'insertTable', 'imageUpload', '|',
                'undo', 'redo'
            ]
        },

        // ===== NOVA CONFIGURAÇÃO DE IMAGEM =====
        image: {
            // Configura a barra de ferramentas que aparece ao clicar na imagem
            toolbar: [
                'imageStyle:inline',
                'imageStyle:block',
                'imageStyle:side',
                '|',
                'imageTextAlternative'
            ],
            // Habilita as opções de redimensionamento
            resizeOptions: [
                {
                    name: 'imageResize:original',
                    value: null,
                    icon: 'original'
                },
                {
                    name: 'imageResize:50',
                    value: '50',
                    icon: 'medium'
                },
                {
                    name: 'imageResize:75',
                    value: '75',
                    icon: 'large'
                }
            ],
        }
    };
}
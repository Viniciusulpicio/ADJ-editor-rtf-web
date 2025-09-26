// src/ckeditor.ts
import { type EditorConfig, Plugin } from '@ckeditor/ckeditor5-core';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';

// Plugins básicos e essenciais (gratuitos)
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Bold, Italic } from '@ckeditor/ckeditor5-basic-styles';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { Table } from '@ckeditor/ckeditor5-table';

// Plugins de imagem (gratuitos)
import { Image, ImageCaption, ImageToolbar } from '@ckeditor/ckeditor5-image';
import { SimpleUploadAdapter } from '@ckeditor/ckeditor5-upload';

export default class CustomEditor extends ClassicEditor {
    public static override builtinPlugins: (typeof Plugin)[] = [
        Essentials,
        Paragraph,
        Heading,
        Bold,
        Italic,
        Link,
        List,
        Table,
        Image,
        ImageToolbar,
        ImageCaption,
        SimpleUploadAdapter // Essencial para o upload de imagem funcionar
    ];

    public static override defaultConfig: EditorConfig = {
        toolbar: {
            items: [
                'heading', '|',
                'bold', 'italic', '|',
                'link', '|',
                'numberedList', 'bulletedList', '|',
                'insertTable', 
                'uploadImage', // Botão para upload de imagem
                '|',
                'undo', 'redo'
            ]
        },

        image: {
            toolbar: [
                'imageStyle:inline', 
                'imageStyle:block', 
                'imageStyle:side', 
                '|', 
                'imageTextAlternative'
            ]
        },

        // Configuração para conectar o botão 'uploadImage' com o seu backend
        simpleUpload: {
            // A URL exata do seu backend que recebe a imagem
            uploadUrl: 'http://localhost:3001/api/upload-image'
        }
    };
}
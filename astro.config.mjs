// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'SAR KICT',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/husky81/sar-kict-pages' }],
			sidebar: [
				//{
				//	label: '과제소개',
				//	items: [
				//		// Each item here is one entry in the navigation menu.
				//		{ label: '1-1 세세부', slug: 'guides/example' },
				//	],
				//},

				{
					label: '과제소개',
					autogenerate: { directory: '01intro' },
				},
				{
					label: '해석프로그램',
					autogenerate: { directory: 'gamma' },
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
	output: 'static',
});

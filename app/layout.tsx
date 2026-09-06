import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Boo Motion Lab',description:'Explore a sleepy plush sloth robot with five joint controls, movement sequences, and a playful 3D environment.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}

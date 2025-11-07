import { 
  HiUserGroup, 
  HiUser, 
  HiClock, 
  HiSparkles, 
  HiTag, 
  HiShoe 
} from 'react-icons/hi2';
import { FaShoePrints } from 'react-icons/fa';

export interface Category {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  key: string;
}

export const categories: Category[] = [
  { name: 'Women', icon: HiUserGroup, key: 'women' },
  { name: 'Men', icon: HiUser, key: 'men' },
  { name: 'Vintage', icon: HiClock, key: 'vintage' },
  { name: 'Designer', icon: HiSparkles, key: 'designer' },
  { name: 'Accessories', icon: HiTag, key: 'accessories' },
  { name: 'Shoes', icon: FaShoePrints, key: 'shoes' },
];


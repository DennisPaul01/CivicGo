import { forwardRef, type ComponentType, type SVGProps } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Activity as ActivityIconData,
  AlertCircle as AlertCircleIconData,
  AlertTriangle as AlertTriangleIconData,
  ArrowDownFromLineIcon as ArrowDownToLineIconData,
  ArrowLeft as ArrowLeftIconData,
  ArrowRight as ArrowRightIconData,
  ArrowUpFromLineIcon as ArrowUpFromLineIconData,
  Award as AwardIconData,
  BadgeCheck as BadgeCheckIconData,
  BarChartIcon as BarChart3IconData,
  Bot as BotIconData,
  Brain as BrainIconData,
  Building2 as Building2IconData,
  CalendarDays as CalendarDaysIconData,
  Camera as CameraIconData,
  Check as CheckIconData,
  CheckmarkCircle02Icon as CheckCircle2IconData,
  ChevronDown as ChevronDownIconData,
  Circle as CircleIconData,
  CircleDashed as CircleDashedIconData,
  ClipboardList as ClipboardListIconData,
  Clock3 as Clock3IconData,
  Compass as CompassIconData,
  CopyCheck as CopyCheckIconData,
  ExternalLink as ExternalLinkIconData,
  Flag as FlagIconData,
  Gift as GiftIconData,
  GitBranch as GitBranchIconData,
  GitMerge as GitMergeIconData,
  Handshake as HandshakeIconData,
  ImageOff as ImageOffIconData,
  ImagePlus as ImagePlusIconData,
  LayersIcon as Layers3IconData,
  LayoutDashboard as LayoutDashboardIconData,
  Leaf as LeafIconData,
  LoaderCircle as LoaderCircleIconData,
  Loading03Icon as Loader2IconData,
  LocateFixed as LocateFixedIconData,
  LockKeyhole as LockKeyholeIconData,
  LogIn as LogInIconData,
  LogOut as LogOutIconData,
  Mail as MailIconData,
  MapPin as MapPinIconData,
  MapPinned as MapPinnedIconData,
  Medal as MedalIconData,
  Menu as MenuIconData,
  MessageSquareText as MessageSquareTextIconData,
  Minus as MinusIconData,
  Navigation as NavigationIconData,
  PackageCheck as PackageCheckIconData,
  PackageOpen as PackageOpenIconData,
  Pencil as PencilIconData,
  Plus as PlusIconData,
  Power as PowerIconData,
  Radar as RadarIconData,
  RadioTower as RadioTowerIconData,
  RotateCcw as RotateCcwIconData,
  Save as SaveIconData,
  Search as SearchIconData,
  SearchX as SearchXIconData,
  Send as SendIconData,
  ShieldCheck as ShieldCheckIconData,
  ShieldX as ShieldXIconData,
  SlidersHorizontal as SlidersHorizontalIconData,
  Sparkles as SparklesIconData,
  Star as StarIconData,
  Store as StoreIconData,
  Target as TargetIconData,
  Trash2 as Trash2IconData,
  TrendingDown as TrendingDownIconData,
  TrendingUp as TrendingUpIconData,
  Trophy as TrophyIconData,
  Upload as UploadIconData,
  UserCircleIcon as UserCircleIconData,
  UserPlus as UserPlusIconData,
  Users as UsersIconData,
  Warning as FileWarningIconData,
  Wrench as WrenchIconData,
  X as XIconData,
} from '@hugeicons/core-free-icons'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>
export type LucideIcon = IconComponent

function createIcon(name: string, icon: IconSvgElement): IconComponent {
  const Icon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
    ({ className, strokeWidth, ...props }, ref) => (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        className={['block shrink-0 align-middle', className]
          .filter(Boolean)
          .join(' ')}
        strokeWidth={
          typeof strokeWidth === 'number' ? strokeWidth : undefined
        }
        {...props}
      />
    ),
  )

  Icon.displayName = name
  return Icon
}

export const Activity = createIcon('Activity', ActivityIconData)
export const AlertCircle = createIcon('AlertCircle', AlertCircleIconData)
export const AlertTriangle = createIcon('AlertTriangle', AlertTriangleIconData)
export const ArrowDownToLine = createIcon('ArrowDownToLine', ArrowDownToLineIconData)
export const ArrowLeft = createIcon('ArrowLeft', ArrowLeftIconData)
export const ArrowRight = createIcon('ArrowRight', ArrowRightIconData)
export const ArrowUpFromLine = createIcon('ArrowUpFromLine', ArrowUpFromLineIconData)
export const Award = createIcon('Award', AwardIconData)
export const BadgeCheck = createIcon('BadgeCheck', BadgeCheckIconData)
export const BarChart3 = createIcon('BarChart3', BarChart3IconData)
export const Bot = createIcon('Bot', BotIconData)
export const Brain = createIcon('Brain', BrainIconData)
export const Building2 = createIcon('Building2', Building2IconData)
export const CalendarDays = createIcon('CalendarDays', CalendarDaysIconData)
export const Camera = createIcon('Camera', CameraIconData)
export const Check = createIcon('Check', CheckIconData)
export const CheckCircle2 = createIcon('CheckCircle2', CheckCircle2IconData)
export const ChevronDown = createIcon('ChevronDown', ChevronDownIconData)
export const Circle = createIcon('Circle', CircleIconData)
export const CircleDashed = createIcon('CircleDashed', CircleDashedIconData)
export const ClipboardList = createIcon('ClipboardList', ClipboardListIconData)
export const Clock3 = createIcon('Clock3', Clock3IconData)
export const Compass = createIcon('Compass', CompassIconData)
export const CopyCheck = createIcon('CopyCheck', CopyCheckIconData)
export const ExternalLink = createIcon('ExternalLink', ExternalLinkIconData)
export const FileWarning = createIcon('FileWarning', FileWarningIconData)
export const Flag = createIcon('Flag', FlagIconData)
export const Gift = createIcon('Gift', GiftIconData)
export const GitBranch = createIcon('GitBranch', GitBranchIconData)
export const GitMerge = createIcon('GitMerge', GitMergeIconData)
export const Handshake = createIcon('Handshake', HandshakeIconData)
export const HeartHandshake = createIcon('HeartHandshake', HandshakeIconData)
export const ImageOff = createIcon('ImageOff', ImageOffIconData)
export const ImagePlus = createIcon('ImagePlus', ImagePlusIconData)
export const Layers3 = createIcon('Layers3', Layers3IconData)
export const LayoutDashboard = createIcon('LayoutDashboard', LayoutDashboardIconData)
export const Leaf = createIcon('Leaf', LeafIconData)
export const Loader2 = createIcon('Loader2', Loader2IconData)
export const LoaderCircle = createIcon('LoaderCircle', LoaderCircleIconData)
export const LocateFixed = createIcon('LocateFixed', LocateFixedIconData)
export const LockKeyhole = createIcon('LockKeyhole', LockKeyholeIconData)
export const LogIn = createIcon('LogIn', LogInIconData)
export const LogOut = createIcon('LogOut', LogOutIconData)
export const Mail = createIcon('Mail', MailIconData)
export const MapPin = createIcon('MapPin', MapPinIconData)
export const MapPinned = createIcon('MapPinned', MapPinnedIconData)
export const Medal = createIcon('Medal', MedalIconData)
export const Menu = createIcon('Menu', MenuIconData)
export const MessageSquareText = createIcon(
  'MessageSquareText',
  MessageSquareTextIconData,
)
export const Minus = createIcon('Minus', MinusIconData)
export const Navigation = createIcon('Navigation', NavigationIconData)
export const PackageCheck = createIcon('PackageCheck', PackageCheckIconData)
export const PackageOpen = createIcon('PackageOpen', PackageOpenIconData)
export const Pencil = createIcon('Pencil', PencilIconData)
export const Plus = createIcon('Plus', PlusIconData)
export const Power = createIcon('Power', PowerIconData)
export const Radar = createIcon('Radar', RadarIconData)
export const RadioTower = createIcon('RadioTower', RadioTowerIconData)
export const RotateCcw = createIcon('RotateCcw', RotateCcwIconData)
export const Save = createIcon('Save', SaveIconData)
export const Search = createIcon('Search', SearchIconData)
export const SearchX = createIcon('SearchX', SearchXIconData)
export const Send = createIcon('Send', SendIconData)
export const ShieldCheck = createIcon('ShieldCheck', ShieldCheckIconData)
export const ShieldX = createIcon('ShieldX', ShieldXIconData)
export const SlidersHorizontal = createIcon(
  'SlidersHorizontal',
  SlidersHorizontalIconData,
)
export const Sparkles = createIcon('Sparkles', SparklesIconData)
export const Star = createIcon('Star', StarIconData)
export const Store = createIcon('Store', StoreIconData)
export const Target = createIcon('Target', TargetIconData)
export const Trash2 = createIcon('Trash2', Trash2IconData)
export const TrendingDown = createIcon('TrendingDown', TrendingDownIconData)
export const TrendingUp = createIcon('TrendingUp', TrendingUpIconData)
export const TriangleAlert = createIcon('TriangleAlert', AlertTriangleIconData)
export const Trophy = createIcon('Trophy', TrophyIconData)
export const Upload = createIcon('Upload', UploadIconData)
export const UserCircle = createIcon('UserCircle', UserCircleIconData)
export const UserPlus = createIcon('UserPlus', UserPlusIconData)
export const Users = createIcon('Users', UsersIconData)
export const Wrench = createIcon('Wrench', WrenchIconData)
export const X = createIcon('X', XIconData)

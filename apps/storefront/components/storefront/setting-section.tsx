"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Icon } from "@iconify/react";
import {
    Accordion,
    Button,
    Chip,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Surface,
    Switch,
    TextField,
    useOverlayState,
} from "@heroui/react";

import { useCustomerLogout } from "@/lib/storefront/use-customer-logout";

export interface SecuritySettings {
    twoFactorEnabled: boolean;
    lastPasswordChange?: string;
}

export interface PrivacySettings {
    profileVisibility: "public" | "private";
    allowMarketingEmails: boolean;
    shareDataWithPartners: boolean;
}

export interface SocialAccounts {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
}

interface SettingsSectionProps {
    merchantSlug: string;
    security?: SecuritySettings;
    privacy?: PrivacySettings;
    socials?: SocialAccounts;
    onChangePassword?: (oldPass: string, newPass: string) => void;
    onToggle2FA?: (enabled: boolean) => void;
    onUpdatePrivacy?: (key: keyof PrivacySettings, value: boolean | string) => void;
    onConnectSocial?: (platform: keyof SocialAccounts, handle: string) => void;
}

const SOCIAL_PLATFORMS: { key: keyof SocialAccounts; label: string; icon: string }[] = [
    { key: "instagram", label: "Instagram", icon: "mdi:instagram" },
    { key: "twitter", label: "Twitter / X", icon: "ri:twitter-x-fill" },
    { key: "tiktok", label: "TikTok", icon: "ic:baseline-tiktok" },
];

function SettingsRow({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{title}</span>
                {description && (
                    <span className="text-xs text-default-500">{description}</span>
                )}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

export function SettingsSection({
    merchantSlug,
    security = { twoFactorEnabled: false, lastPasswordChange: "3 months ago" },
    privacy = { profileVisibility: "public", allowMarketingEmails: true, shareDataWithPartners: false },
    socials = { instagram: "storefront_official" },
    onChangePassword,
    onToggle2FA,
    onUpdatePrivacy,
    onConnectSocial,
}: SettingsSectionProps) {
    const logout = useCustomerLogout(merchantSlug);
    const passwordModal = useOverlayState({ defaultOpen: false });
    const socialModal = useOverlayState({ defaultOpen: false });

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState<keyof SocialAccounts>("instagram");
    const [socialHandle, setSocialHandle] = useState("");
    const [connectedSocials, setConnectedSocials] = useState<SocialAccounts>(socials);

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(security.twoFactorEnabled);
    const [profileVisibility, setProfileVisibility] = useState(privacy.profileVisibility);
    const [marketingEmails, setMarketingEmails] = useState(privacy.allowMarketingEmails);
    const [shareData, setShareData] = useState(privacy.shareDataWithPartners);

    // Stabilize expanded keys array reference to prevent re-render loops
    const defaultExpandedKeys = useMemo(() => ["security", "privacy", "social"], []);

    const handlePasswordSubmit = () => {
        onChangePassword?.(oldPassword, newPassword);
        setOldPassword("");
        setNewPassword("");
        passwordModal.close();
    };

    const openSocialModal = (platform: keyof SocialAccounts) => {
        setSelectedPlatform(platform);
        setSocialHandle(connectedSocials[platform] ?? "");
        socialModal.open();
    };

    const handleSocialSubmit = () => {
        const handle = socialHandle.trim();
        if (!handle) return;

        setConnectedSocials((prev) => ({ ...prev, [selectedPlatform]: handle }));
        onConnectSocial?.(selectedPlatform, handle);
        setSocialHandle("");
        socialModal.close();
    };

    const handleToggle2FA = (value: boolean) => {
        setTwoFactorEnabled(value);
        onToggle2FA?.(value);
    };

    const handleVisibilityChange = (isPublic: boolean) => {
        const value = isPublic ? "public" : "private";
        setProfileVisibility(value);
        onUpdatePrivacy?.("profileVisibility", value);
    };

    const handleMarketingChange = (value: boolean) => {
        setMarketingEmails(value);
        onUpdatePrivacy?.("allowMarketingEmails", value);
    };

    const handleShareDataChange = (value: boolean) => {
        setShareData(value);
        onUpdatePrivacy?.("shareDataWithPartners", value);
    };

    return (
        <div className="flex flex-col gap-4">
            <Surface className="rounded-3xl border border-neutral-200 dark:border-neutral-700">
                <Accordion defaultExpandedKeys={defaultExpandedKeys} className="px-2">
                    <Accordion.Item id="security">
                        <Accordion.Heading>
                            <Accordion.Trigger className="flex w-full items-center justify-between gap-3 py-4 text-left">
                                <span className="flex items-center gap-3">
                                    <Icon icon="solar:shield-keyhole-outline" className="size-5 text-accent" />
                                    <span className="text-sm font-semibold">Security</span>
                                </span>
                                <Accordion.Indicator />
                            </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                            <Accordion.Body className="flex flex-col gap-4 pb-4">
                                <SettingsRow
                                    title="Two-factor authentication"
                                    description="Add an extra layer of security to your account"
                                >
                                    <div className="flex items-center gap-2">
                                        {twoFactorEnabled && (
                                            <Chip size="sm" color="success" variant="soft">
                                                <Chip.Label>On</Chip.Label>
                                            </Chip>
                                        )}
                                        <Switch isSelected={twoFactorEnabled} onChange={handleToggle2FA}>
                                            <Switch.Content>
                                                <Switch.Control>
                                                    <Switch.Thumb />
                                                </Switch.Control>
                                            </Switch.Content>
                                        </Switch>
                                    </div>
                                </SettingsRow>

                                <button
                                    type="button"
                                    className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-3 py-3 text-left transition-colors hover:bg-neutral-50 active:scale-[0.99] dark:border-neutral-700 dark:hover:bg-neutral-800/50"
                                    onClick={passwordModal.open}
                                >
                                    <span className="flex min-w-0 flex-col">
                                        <span className="text-sm font-medium">Change password</span>
                                        <span className="text-xs text-default-500">
                                            Last changed {security.lastPasswordChange ?? "recently"}
                                        </span>
                                    </span>
                                    <Icon icon="solar:alt-arrow-right-linear" className="size-4 shrink-0 text-default-400" />
                                </button>
                            </Accordion.Body>
                        </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item id="privacy">
                        <Accordion.Heading>
                            <Accordion.Trigger className="flex w-full items-center justify-between gap-3 py-4 text-left">
                                <span className="flex items-center gap-3">
                                    <Icon icon="solar:eye-outline" className="size-5 text-accent" />
                                    <span className="text-sm font-semibold">Privacy</span>
                                </span>
                                <Accordion.Indicator />
                            </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                            <Accordion.Body className="flex flex-col gap-4 pb-4">
                                <SettingsRow
                                    title="Public profile"
                                    description="Let other shoppers see your reviews and activity"
                                >
                                    <Switch
                                        isSelected={profileVisibility === "public"}
                                        onChange={handleVisibilityChange}
                                    >
                                        <Switch.Content>
                                            <Switch.Control>
                                                <Switch.Thumb />
                                            </Switch.Control>
                                        </Switch.Content>
                                    </Switch>
                                </SettingsRow>

                                <SettingsRow
                                    title="Marketing emails"
                                    description="Offers, new arrivals, and restock alerts"
                                >
                                    <Switch isSelected={marketingEmails} onChange={handleMarketingChange}>
                                        <Switch.Content>
                                            <Switch.Control>
                                                <Switch.Thumb />
                                            </Switch.Control>
                                        </Switch.Content>
                                    </Switch>
                                </SettingsRow>

                                <SettingsRow
                                    title="Share data with partners"
                                    description="Helps us personalize recommendations"
                                >
                                    <Switch isSelected={shareData} onChange={handleShareDataChange}>
                                        <Switch.Content>
                                            <Switch.Control>
                                                <Switch.Thumb />
                                            </Switch.Control>
                                        </Switch.Content>
                                    </Switch>
                                </SettingsRow>
                            </Accordion.Body>
                        </Accordion.Panel>
                    </Accordion.Item>

                    <Accordion.Item id="social">
                        <Accordion.Heading>
                            <Accordion.Trigger className="flex w-full items-center justify-between gap-3 py-4 text-left">
                                <span className="flex items-center gap-3">
                                    <Icon icon="solar:link-outline" className="size-5 text-accent" />
                                    <span className="text-sm font-semibold">Connected accounts</span>
                                </span>
                                <Accordion.Indicator />
                            </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                            <Accordion.Body className="flex flex-col gap-3 pb-4">
                                {SOCIAL_PLATFORMS.map((platform) => {
                                    const handle = connectedSocials[platform.key];

                                    return (
                                        <div
                                            key={platform.key}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-3 py-3 dark:border-neutral-700"
                                        >
                                            <span className="flex min-w-0 items-center gap-3">
                                                <Icon icon={platform.icon} className="size-5 shrink-0 text-default-500" />
                                                <span className="flex min-w-0 flex-col">
                                                    <span className="text-sm font-medium">{platform.label}</span>
                                                    <span className="truncate text-xs text-default-500">
                                                        {handle ? `@${handle}` : "Not connected"}
                                                    </span>
                                                </span>
                                            </span>
                                            <Button
                                                size="sm"
                                                variant={handle ? "ghost" : "secondary"}
                                                onPress={() => openSocialModal(platform.key)}
                                            >
                                                {handle ? "Edit" : "Connect"}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </Accordion.Body>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Surface>

            <Button
                type="button"
                variant="ghost"
                className="w-full justify-center gap-2 text-danger"
                isDisabled={logout.isPending}
                onPress={() => logout.mutate()}
            >
                <Icon icon="solar:logout-3-outline" className="size-4" />
                {logout.isPending ? "Logging out..." : "Log out"}
            </Button>

            <Modal isOpen={passwordModal.isOpen} onOpenChange={passwordModal.setOpen}>
                <Modal.Backdrop>
                    <Modal.Container placement="center">
                        <Modal.Dialog className="w-full max-w-sm">
                            <ModalHeader>
                                <h2 className="text-lg font-semibold">Change password</h2>
                            </ModalHeader>
                            <ModalBody>
                                <div className="flex flex-col gap-4">
                                    <TextField
                                        type="password"
                                        value={oldPassword}
                                        onChange={setOldPassword}
                                    >
                                        <Label>Current password</Label>
                                        <Input />
                                    </TextField>
                                    <TextField
                                        type="password"
                                        value={newPassword}
                                        onChange={setNewPassword}
                                    >
                                        <Label>New password</Label>
                                        <Input />
                                    </TextField>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button type="button" variant="ghost" onPress={passwordModal.close}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    isDisabled={!oldPassword || !newPassword}
                                    onPress={handlePasswordSubmit}
                                >
                                    Save
                                </Button>
                            </ModalFooter>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

            <Modal isOpen={socialModal.isOpen} onOpenChange={socialModal.setOpen}>
                <Modal.Backdrop>
                    <Modal.Container placement="center">
                        <Modal.Dialog className="w-full max-w-sm">
                            <ModalHeader>
                                <h2 className="text-lg font-semibold">Connect account</h2>
                            </ModalHeader>
                            <ModalBody>
                                <div className="flex flex-col gap-4">
                                    <div className="flex gap-2">
                                        {SOCIAL_PLATFORMS.map((platform) => (
                                            <button
                                                key={platform.key}
                                                type="button"
                                                onClick={() => setSelectedPlatform(platform.key)}
                                                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-medium transition-colors ${
                                                    selectedPlatform === platform.key
                                                        ? "border-accent bg-accent/10 text-accent"
                                                        : "border-neutral-200 text-default-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
                                                }`}
                                            >
                                                <Icon icon={platform.icon} className="size-5" />
                                                {platform.label}
                                            </button>
                                        ))}
                                    </div>

                                    <TextField value={socialHandle} onChange={setSocialHandle}>
                                        <Label>Username</Label>
                                        <Input placeholder="yourhandle" />
                                    </TextField>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button type="button" variant="ghost" onPress={socialModal.close}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    isDisabled={!socialHandle.trim()}
                                    onPress={handleSocialSubmit}
                                >
                                    Save
                                </Button>
                            </ModalFooter>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}

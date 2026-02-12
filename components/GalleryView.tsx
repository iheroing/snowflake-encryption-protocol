
import React, { useState, useEffect, useMemo } from 'react';
import { getSnowflakes, type SnowflakeRecord, deleteSnowflake, forceLoadPresets } from '../utils/storage';
import { generateSnowflakeDataURL } from '../utils/snowflakeGenerator';
import { decrypt } from '../utils/encryption';
import { buildShareUrl, getSnowflakeId } from '../utils/share';
import SoundToggleButton from './SoundToggleButton';
import { useSound } from '../contexts/SoundContext';
import LanguageToggleButton from './LanguageToggleButton';
import { useI18n } from '../contexts/I18nContext';

interface Props {
  onExit: () => void;
  onViewSnowflake?: (payload: { message: string; signature: string }) => void;
}

const GalleryView: React.FC<Props> = ({ onExit, onViewSnowflake }) => {
  const [records, setRecords] = useState<SnowflakeRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SnowflakeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const { play } = useSound();
  const { t, localeTag } = useI18n();

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const loadedRecords = getSnowflakes();
      setRecords(loadedRecords);
    } catch (error) {
      console.error('[Gallery] Failed to load records:', error);
      setRecords([]);
      setLoadError(t('gallery.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPresets = () => {
    forceLoadPresets();
    loadRecords();
  };

  // 过滤和排序记录
  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    
    // 搜索过滤
    if (searchQuery.trim()) {
      filtered = filtered.filter(record => 
        record.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 排序
    if (sortBy === 'oldest') {
      filtered.reverse();
    }
    
    return filtered;
  }, [records, searchQuery, sortBy]);

  const handleViewSnowflake = (record: SnowflakeRecord) => {
    if (record.hasPassword && record.encryptedMessage) {
      // 需要密码
      setSelectedRecord(record);
      setShowPasswordPrompt(true);
      setPassword("");
      setDecryptError("");
    } else {
      // 直接查看
      setSelectedRecord(record);
    }
  };

  const handleDecrypt = async () => {
    if (!selectedRecord || !selectedRecord.encryptedMessage) return;
    
    try {
      const decryptedMessage = await decrypt(selectedRecord.encryptedMessage, password);
      // 解密成功，更新显示的消息
      setSelectedRecord({
        ...selectedRecord,
        message: decryptedMessage
      });
      setShowPasswordPrompt(false);
      setPassword("");
      setDecryptError("");
    } catch (error) {
      setDecryptError(t('gallery.decryptError'));
    }
  };

  const handleDeleteSnowflake = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('gallery.deleteConfirm'))) {
      deleteSnowflake(id);
      loadRecords();
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedRecord(null);
  };

  const handleShareRecord = async (record: SnowflakeRecord, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (!record.message.trim() || (record.hasPassword && record.message.trim().startsWith('🔒'))) {
      alert(t('gallery.encryptedNeedDecrypt'));
      return;
    }

    const shareUrl = await buildShareUrl(record.message, record.id, record.timestamp);

    try {
      if (navigator.share) {
        await navigator.share({
          title: t('gallery.shareTitle'),
          text: t('gallery.shareText', { id: getSnowflakeId(record.id) }),
          url: shareUrl
        });
        play('share');
        return;
      }
    } catch {
      // fall back to clipboard
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      play('share');
      alert(t('gallery.shareCopied'));
    } catch {
      prompt(t('common.copyPrompt'), shareUrl);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(localeTag, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('gallery.justNow');
    if (minutes < 60) return t('gallery.minutesAgo', { count: minutes });
    if (hours < 24) return t('gallery.hoursAgo', { count: hours });
    if (days < 7) return t('gallery.daysAgo', { count: days });
    return formatDate(timestamp);
  };

  const handleSnowflakeImageError = (
    event: React.SyntheticEvent<HTMLImageElement>,
    signature: string,
    size: number
  ) => {
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied === '1') {
      return;
    }
    image.dataset.fallbackApplied = '1';
    image.src = generateSnowflakeDataURL(signature, size, signature);
  };

  const getDisplayMessage = (record: SnowflakeRecord): string => {
    if (record.hasPassword && record.message.trim().startsWith('🔒')) {
      return t('gallery.passwordPromptTitle');
    }
    return record.message;
  };

  return (
    <div className="relative w-full min-h-[var(--cine-viewport)]">
      <div className="relative z-10 min-h-[var(--cine-viewport)] overflow-y-auto bg-background-dark/80 backdrop-blur-sm scroll-smooth pb-[calc(var(--cine-safe-bottom)+9rem)] px-4 md:px-8">
        <header className="sticky top-[var(--cine-safe-top)] z-50 cine-stage flex items-center justify-between px-4 md:px-5 py-3 cine-header">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">ac_unit</span>
          <h2 className="font-display text-lg font-bold tracking-[0.16em] uppercase">{t('gallery.title')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggleButton compact />
          <SoundToggleButton compact />
          <button onClick={onExit} className="cine-btn-ghost px-5 py-2.5 text-sm font-bold tracking-[0.16em] uppercase">
            {t('common.back')}
          </button>
        </div>
      </header>

      <main className="cine-stage px-2 md:px-4 pt-14 md:pt-16">
        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 cine-pill text-primary text-[10px] font-bold tracking-[0.18em] mb-8 animate-pulse uppercase">
            {t('gallery.preserved', { count: records.length })}
          </div>
          <h1 className="font-display text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight italic">
            {t('gallery.heroLine1')} <br/><span className="text-primary not-italic">{t('gallery.heroLine2')}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-white/50 font-light leading-relaxed">
            {records.length > 0 
              ? t('gallery.introHasRecords')
              : t('gallery.introEmpty')
            }
          </p>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/60">
            <span className="material-symbols-outlined text-4xl animate-spin mb-4">progress_activity</span>
            {t('gallery.loading')}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="text-red-400 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {loadError}
            </div>
            <button
              onClick={loadRecords}
              className="px-6 py-3 bg-primary text-background-dark font-bold rounded-xl hover:brightness-110 transition-all"
            >
              {t('gallery.reload')}
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="size-32 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-6xl text-primary/40">ac_unit</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">{t('gallery.emptyTitle')}</h3>
            <p className="text-white/40 mb-8">{t('gallery.emptyDesc')}</p>
            <div className="flex gap-4">
              <button 
                onClick={handleLoadPresets}
                className="px-8 py-4 cine-btn-accent font-bold"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  {t('gallery.loadPresets')}
                </span>
              </button>
              <button 
                onClick={onExit}
                className="px-8 py-4 cine-btn-primary font-bold"
              >
                {t('gallery.create')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                onClick={() => handleViewSnowflake(record)}
                className="group relative aspect-[4/5] rounded-3xl p-8 cine-panel overflow-hidden transition-all duration-500 hover:border-primary/40 hover:-translate-y-2 cursor-pointer"
              >
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
                
                {/* 雪花预览 */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                  <img 
                    src={generateSnowflakeDataURL(record.encryptedMessage ?? record.message, 400, record.id)}
                    alt="snowflake"
                    className="w-full h-full object-contain"
                    onError={(event) => handleSnowflakeImageError(event, record.id, 400)}
                  />
                </div>
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] tracking-widest uppercase">
                      {formatRelativeTime(record.timestamp)}
                    </span>
                    <div className="flex items-center gap-2">
                      {record.hasPassword && (
                        <span className="material-symbols-outlined text-primary/60 text-sm" title={t('gallery.lockTitle')}>
                          lock
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteSnowflake(record.id, e)}
                        className="material-symbols-outlined text-red-400/40 hover:text-red-400 transition-colors text-sm"
                        title={t('gallery.deleteTitle')}
                      >
                        delete
                      </button>
                      <button
                        onClick={(e) => handleShareRecord(record, e)}
                        className="material-symbols-outlined text-primary/40 hover:text-primary transition-colors text-sm"
                        title={t('gallery.shareTitleShort')}
                      >
                        share
                      </button>
                      <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                        visibility
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl mb-4 italic leading-snug text-white/90 line-clamp-3">
                      {getDisplayMessage(record)}
                    </h4>
                    {record.hasPassword && (
                      <p className="text-primary/60 text-xs mb-2">{t('gallery.encryptedHint')}</p>
                    )}
                    <p className="text-[10px] tracking-widest uppercase text-white/35 mb-2">
                      {getSnowflakeId(record.id)}
                    </p>
                    <div className="flex items-center gap-2 text-white/30 text-xs tracking-widest uppercase">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {formatDate(record.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 添加新心语卡片 */}
            <div 
              onClick={onExit}
              className="group relative aspect-[4/5] rounded-3xl p-8 border border-dashed border-primary/30 bg-white/[0.02] flex flex-col items-center justify-center text-center gap-6 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="size-20 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <span className="material-symbols-outlined text-4xl">add</span>
              </div>
              <h4 className="font-display text-2xl">{t('gallery.newWhisper')}</h4>
              <p className="text-sm text-white/40 leading-relaxed px-4">
                {t('gallery.newWhisperDesc')}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 雪花查看模态框 */}
      {selectedRecord && !showPasswordPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div 
            className="relative max-w-4xl w-full mx-8 cine-panel-strong p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-6 right-6 size-10 rounded-full cine-btn-ghost flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex flex-col items-center gap-8">
              <span className="text-primary/60 text-xs tracking-widest uppercase">
                {formatDate(selectedRecord.timestamp)}
              </span>
              
              <img 
                src={generateSnowflakeDataURL(selectedRecord.message, 600, selectedRecord.id)}
                alt="snowflake"
                className="w-96 h-96 object-contain animate-[spin_20s_linear_infinite]"
                onError={(event) => handleSnowflakeImageError(event, selectedRecord.id, 600)}
              />
              
              <h2 className="text-4xl font-serif italic text-center leading-relaxed max-w-2xl">
                {selectedRecord.message}
              </h2>

              <p className="text-[10px] tracking-[0.2em] uppercase text-primary/50">
                {getSnowflakeId(selectedRecord.id)}
              </p>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    // 重新查看这个雪花
                    if (onViewSnowflake) {
                      onViewSnowflake({ message: selectedRecord.message, signature: selectedRecord.id });
                    }
                    handleCloseModal();
                  }}
                  className="px-6 py-3 cine-btn-accent"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">replay</span>
                    {t('gallery.replay')}
                  </span>
                </button>
                <button
                  onClick={() => handleShareRecord(selectedRecord)}
                  className="px-6 py-3 cine-btn-ghost"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">share</span>
                    {t('gallery.shareLink')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Floating HUD */}
      <div className="fixed bottom-[calc(var(--cine-safe-bottom)+20px)] left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 cine-panel-strong p-2">
        <div className="flex gap-1 border-r border-white/10 pr-2">
          <button 
            title={t('gallery.refresh')}
            onClick={loadRecords}
            className="group relative p-3 hover:text-primary transition-colors rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-background-dark/90 border border-primary/20 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {t('gallery.refresh')}
            </span>
          </button>
          <button 
            title={t('gallery.search')}
            onClick={() => setShowSearch(!showSearch)}
            className={`group relative p-3 transition-colors rounded-xl ${showSearch ? 'text-primary' : 'hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-background-dark/90 border border-primary/20 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {t('gallery.search')}
            </span>
          </button>
          <button 
            title={sortBy === 'newest' ? t('gallery.sortNewest') : t('gallery.sortOldest')}
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
            className="group relative p-3 hover:text-primary transition-colors rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">
              {sortBy === 'newest' ? 'arrow_downward' : 'arrow_upward'}
            </span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-background-dark/90 border border-primary/20 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {sortBy === 'newest' ? t('gallery.sortNewest') : t('gallery.sortOldest')}
            </span>
          </button>
          <button 
            title={t('gallery.loadPresetTooltip')}
            onClick={handleLoadPresets}
            className="group relative p-3 hover:text-primary transition-colors rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-background-dark/90 border border-primary/20 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {t('gallery.loadPresets')}
            </span>
          </button>
        </div>
        <button onClick={onExit} className="cine-btn-primary font-bold py-3 px-8 flex items-center gap-2 active:scale-95">
          <span className="material-symbols-outlined text-[20px]">add_comment</span>
          {t('gallery.create')}
        </button>
      </div>

      {/* 搜索框 */}
      {showSearch && (
        <div className="fixed bottom-[calc(var(--cine-safe-bottom)+90px)] left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('gallery.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full cine-panel-strong px-6 py-4 pr-12 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
            autoFocus
          />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/40">
              search
            </span>
          </div>
          {searchQuery && (
            <div className="mt-2 text-center text-xs text-white/40">
              {t('gallery.foundCount', { count: filteredRecords.length })}
            </div>
          )}
        </div>
      )}

      {/* 密码输入模态框 */}
      {showPasswordPrompt && selectedRecord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setShowPasswordPrompt(false);
            setSelectedRecord(null);
            setPassword("");
            setDecryptError("");
          }}
        >
          <div 
            className="relative max-w-md w-full mx-8 cine-panel-strong p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setShowPasswordPrompt(false);
                setSelectedRecord(null);
                setPassword("");
                setDecryptError("");
              }}
              className="absolute top-4 right-4 size-8 rounded-full cine-btn-ghost flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="flex flex-col items-center gap-6">
              <div className="size-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">lock</span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{t('gallery.passwordPromptTitle')}</h3>
                <p className="text-white/50 text-sm">{t('gallery.passwordPromptDesc')}</p>
              </div>

              <div className="w-full space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    placeholder={t('gallery.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setDecryptError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleDecrypt();
                      }
                    }}
                    className="w-full cine-panel px-4 py-3 text-white placeholder:text-white/30 focus:border-primary/40 focus:outline-none transition-all"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/30 text-lg">
                    key
                  </span>
                </div>

                {decryptError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {decryptError}
                  </div>
                )}

                <button
                  onClick={handleDecrypt}
                  disabled={!password}
                  className="w-full cine-btn-primary font-bold py-3 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {t('gallery.decryptView')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;

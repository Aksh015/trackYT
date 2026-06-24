import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, MessageCircle, Clock } from 'lucide-react';
import { timeAgo } from '../utils/formatters';

export default function EventCard({ event, channelName }) {
  const { eventType, oldValue, newValue, metadata, detectedAt, channelId } = event;
  const videoId = metadata?.videoId;

  const actionText = {
    'NEW_VIDEO': 'uploaded a new video',
    'TITLE_CHANGED': "changed a video's title",
    'THUMBNAIL_CHANGED': "swapped a video's thumbnail",
    'CHANNEL_RENAMED': 'renamed their channel',
    'PROFILE_PICTURE_CHANGED': 'updated their profile picture',
  }[eventType] || 'made a change';

  const renderTitleLink = (titleText, className) => {
    if (videoId) {
      return (
        <Link to={`/channels/${channelId}/videos/${videoId}`} className={`hover:underline text-ink-900 ${className} block transition-colors`}>
          {titleText}
        </Link>
      );
    }
    return <p className={className}>{titleText}</p>;
  };

  const renderContent = () => {
    switch (eventType) {
      case 'NEW_VIDEO':
        // Try to get stats if we saved them, otherwise use placeholders for the design preview
        const views = newValue?.views || metadata?.views;
        const likes = newValue?.likes || metadata?.likes;
        const comments = newValue?.comments || metadata?.comments;

        return (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {(newValue?.archivedThumbnailURL || newValue?.thumbnailURL) && (
              <img src={newValue.archivedThumbnailURL || newValue.thumbnailURL} alt="Thumbnail" className="w-48 rounded-xl border-2 border-ink-900 object-cover" />
            )}
            <div className="flex flex-col justify-start">
              {renderTitleLink(newValue?.title, "font-bold text-xl mb-3")}
              
              {/* Stat Pills */}
              {(views !== undefined || likes !== undefined) && (
                <div className="flex flex-wrap gap-3 mt-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white border-2 border-ink-900 rounded-full shadow-[3px_3px_0px_0px_#111] text-sm font-bold">
                    <Eye className="w-4 h-4" strokeWidth={3} /> 
                    <span>{views >= 1000 ? (views/1000).toFixed(1) + 'K' : views}</span>
                    <span className="font-medium text-xs">views</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-ink-900 border-2 border-ink-900 rounded-full shadow-[3px_3px_0px_0px_#111] text-sm font-bold">
                    <ThumbsUp className="w-4 h-4" strokeWidth={3} /> 
                    <span>{likes >= 1000 ? (likes/1000).toFixed(1) + 'K' : likes}</span>
                    <span className="font-medium text-xs">likes</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-tertiary text-white border-2 border-ink-900 rounded-full shadow-[3px_3px_0px_0px_#111] text-sm font-bold">
                    <MessageCircle className="w-4 h-4" strokeWidth={3} /> 
                    <span>{comments >= 1000 ? (comments/1000).toFixed(1) + 'K' : comments}</span>
                    <span className="font-medium text-xs">comments</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'TITLE_CHANGED':
        return (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {metadata?.thumbnailURL && (
              <img src={metadata.thumbnailURL} alt="Thumbnail" className="w-48 rounded-xl border-2 border-ink-900 object-cover" />
            )}
            <div className="flex flex-col justify-center space-y-1">
              <p className="text-ink-500 line-through text-base">was: {oldValue?.title}</p>
              {renderTitleLink(`now: ${newValue?.title}`, "font-bold text-lg")}
            </div>
          </div>
        );
      case 'THUMBNAIL_CHANGED':
        return (
          <div className="mt-4">
            <p className="text-base text-ink-700 mb-3">
              Thumbnail swapped on {renderTitleLink(`"${metadata?.title}"`, "font-bold text-base inline")}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <img
                  src={oldValue?.archivedThumbnailURL || oldValue?.thumbnailURL}
                  alt="Old thumbnail"
                  className="w-44 h-auto rounded-xl border-2 border-ink-900 object-cover"
                />
                <span className="text-xs font-bold text-ink-500 mt-1.5 uppercase tracking-wider">Was</span>
              </div>
              <span className="text-2xl text-ink-400 font-bold select-none">→</span>
              <div className="flex flex-col items-center">
                <img
                  src={newValue?.archivedThumbnailURL || newValue?.thumbnailURL}
                  alt="New thumbnail"
                  className="w-44 h-auto rounded-xl border-2 border-ink-900 object-cover"
                />
                <span className="text-xs font-bold text-ink-900 mt-1.5 uppercase tracking-wider">Now</span>
              </div>
            </div>
          </div>
        );
      case 'CHANNEL_RENAMED':
        return (
          <div className="mt-4 flex flex-col justify-center space-y-1">
            <p className="text-ink-500 line-through text-base">was: {oldValue?.channelName}</p>
            <p className="font-bold text-lg">now: {newValue?.channelName}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-4 border-ink-900 rounded-3xl p-6 mb-6 block w-full hover:-translate-y-1 transition-transform shadow-[8px_8px_0px_0px_#1A1A1A]">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h3 className="font-bold text-xl text-ink-900">
          {channelName} <span className="font-medium">{actionText}</span>
        </h3>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary border-2 border-ink-900 rounded-full shadow-[2px_2px_0px_0px_#111] text-xs font-bold text-ink-900">
          <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
          {timeAgo(detectedAt)}
        </span>
      </div>
      {renderContent()}
    </div>
  );
}

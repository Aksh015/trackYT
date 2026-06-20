import { Link } from 'react-router-dom';
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
            {newValue?.thumbnailURL && (
              <img src={newValue.thumbnailURL} alt="Thumbnail" className="w-48 rounded-xl border-2 border-ink-900 object-cover" />
            )}
            <div className="flex flex-col justify-start">
              {renderTitleLink(newValue?.title, "font-bold text-xl mb-3")}
              
              {/* Stat Pills */}
              {(views !== undefined || likes !== undefined) && (
                <div className="flex flex-wrap gap-3 mt-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#A3E6D7] border-2 border-ink-900 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm font-bold">
                    <span>👁</span> 
                    <span>{views >= 1000 ? (views/1000).toFixed(1) + 'K' : views}</span>
                    <span className="font-medium text-xs">views</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FDEBB2] border-2 border-ink-900 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm font-bold">
                    <span>👍</span> 
                    <span>{likes >= 1000 ? (likes/1000).toFixed(1) + 'K' : likes}</span>
                    <span className="font-medium text-xs">likes</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#C4D2FE] border-2 border-ink-900 rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm font-bold">
                    <span>💬</span> 
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
            {renderTitleLink(metadata?.title, "font-bold text-xl mb-3")}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <span className="text-sm font-bold text-ink-500 mb-1 block">was:</span>
                <img src={oldValue?.thumbnailURL} alt="Old" className="w-full rounded-xl border-2 border-ink-900 object-cover" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold block mb-1">now:</span>
                <img src={newValue?.thumbnailURL} alt="New" className="w-full rounded-xl border-2 border-ink-900 object-cover" />
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
        <span className="flex items-center gap-1.5 px-3 py-1 bg-[#FDEBB2] border-2 border-ink-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold text-ink-900">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {timeAgo(detectedAt)}
        </span>
      </div>
      {renderContent()}
    </div>
  );
}

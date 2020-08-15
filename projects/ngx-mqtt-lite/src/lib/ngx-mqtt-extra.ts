import { PolicyTopicOption } from './ngx-mqtt-lite.types';

const factoryPolicyTopic = (data: PolicyTopicOption[]): string[] => {
  const topic = [];
  for (const x of data) {
    // is common
    if (x.policy === 0) {
      topic.push(x.topic);
    }
    // is private
    if (x.policy === 1) {
      topic.push(x.topic + '/' + x.username);
    }
  }
  return topic;
};

export { factoryPolicyTopic };

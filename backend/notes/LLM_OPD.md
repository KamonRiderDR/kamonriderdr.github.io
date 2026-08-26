# 大模型知识蒸馏：On\-Policy Distillation（原理篇）







# 基础知识

## 大模型基础

![image\.png](backend/assets/images/opd/图片和附件/image%2034.png)



**预训练**：NTP的训练方式。对应的还有诸如CPT（持续预训练）、Mid\-Training等。损失函数为：

$$\mathcal{L}_{pretrain} = -\sum_{i=1}^{L} \log(x_i|x_{<i};\theta)$$

**监督微调（SFT）**：通常作为后训练的第一步或者RL的冷启动步骤，目的是通过微调的方式注入一些知识或者让模型掌握一个大致的答题的步骤格式。损失函数可以表示为面向特定部分（答案部分）的预训练损失（通过添加特殊的`mask`实现）：

$$\mathcal{L}_{SFT} = -\sum_{i=1}^{L}\log(y_i|x,y_{<t};\theta)$$



**强化学习（RL）**：RL采取的是先生成再打分的策略，即policy model先生成策略轨迹，再基于规则或者使用reward model去进行轨迹级别的打分，最后基于这个得分进行token级别的更新，类似这种weighting的方式，这里将对应的损失函数表示为：



$$\mathcal{L}_{RL} = -\mathbb{E}_{x\sim p(x)} \mathbb{E}_{y\sim\pi(\cdot|x)}    \big[
        w(x,y)\log \pi(y|x)
    \big]$$





## 知识蒸馏

经典的蒸馏方法就是通过最小化教师网络和学生网络之间的KL散度来提高学生网络的性能：



$$\mathcal{L}_{KL} = \mathcal{D}_{KL}(\pi_{\text{teacher}} || \pi_{\theta}) = -\sum_{i=1}^{N}p_i^T\log(p_i^S)$$



这里保持教师网络模型参数冻结，只训练学生网络的参数。

KL散度在**分类问题**上能够很好地解决泛化性的问题，但是LLM不是分类问题，而是一个**生成问题**，此时直接基于logits的蒸馏就有问题了。简单来说，KL散度做的是教师分布和学生分布之间的对齐，而教师分布可能是一个多峰的分布，此时学生分布可能就在两个分布之间取得一个trade\-off，**即通过这种“折中”的方式实现整体损失函数的最小化。**但在下一个词预测的任务中，我们可能更关注的不是尾部的词，相反我们更关注**那些“出现概率较大的词语”**，尤其是对于文本空间而言，词表的维度是很大的，而尾部词汇又呈现一个长尾的分布。这种情况下就对头部的词元的概率分布有更高的权重倾向，因此传统的KL散度会导致幻觉现象——**出现一些意料之外的词，即概率远低于我们期望的词汇**。



![image\.png](backend/assets/images/opd/图片和附件/image%2015.png)


因此LLM的蒸馏中一般用逆KL散度去代替KL散度，其公式为：



$$\mathcal{L}_{RKL} = \mathcal{D}_{KL}({ \pi_{\theta} || \pi_\text{teacher}}) = \mathbb{E}_{x\sim\pi_\theta} \left[ \log \pi_\theta(x_{t+1}|x_{1..t}) - \log \pi_{\text{teacher}}(x_{t+1}|x_{1..t}) \right]$$





**为什么LLM使用RKL而不是KL？**

假设目标分布是Q，已知分布是P，我们的期望是使`Q->P`。

KL散度的定义为：



$$\mathcal{D}_{KL}(P||Q) = \sum_{x} P(x)\log \frac{P(x)}{Q(x)}$$



这里**只有Q是待优化的目标，P是无需训练的目标。梯**度更新的时候有：



$$\nabla\mathcal{L}_{KL}\bigl|_{z_k} = \frac{\partial\mathcal{L}_{KL}}{\partial{z_k}} = -\sum_x P(y)\frac{\partial{\log Q(x)}}{\partial z_k}$$



这里Q是z的`softmax`函数，则Q对z的梯度为：



$$\frac{\partial\log Q(x)}{\partial z_k} = \delta_{xk} - Q(k)$$



则：



$$\frac{\partial \mathcal{L}_{KL}}{\partial z_k} = -\sum_x P(x)(\delta_{xk} - Q(k))
= Q(k)-P(k)$$




相对应地，逆KL散度的定义为：



$$\mathcal{D}_{KL}(Q||P) = \sum_x Q(x)\log\frac{Q(x)}{P(x)}$$



这里同样地对$z_k$求偏导，有：



$$\nabla \mathcal{L}_{RKL}\bigl|_{z_k} = \frac{\partial\mathcal{L}_{RKL}}{\partial{z_k}} = 
\color{red}{\frac{\partial}{\partial z_k} \sum_x Q(x)\log Q(x)}
\color{black}{-} 
\color{blue}{\frac{\partial}{\partial{z_k}}\sum_xQ(x)\log P(x)}$$



**（i）对于第一项进一步推导：**



$$\color{red}{\frac{\partial}{\partial z_k} \sum_x Q(x)\log Q(x)} 
= \color{black}{\sum_x}\frac{\partial Q(x)}{\partial z_k}\bigl( \log Q(x) + 1 \bigr)$$



**（ii）对于第二项进一步推导：**



$$\color{blue}{\frac{\partial}{\partial{z_k}}\sum_xQ(x)\log P(x)}
\color{black}{
=\sum_x\frac{\partial Q(x)}{\partial z_k}\log P(x) 
}$$



而Q\(x\)的求导就是softmax函数的偏导，最终化简合并可以得到：



$$\frac{\partial \mathcal{L}_{RKL}}{\partial z_k} = Q(k)\Bigl( \log \frac{Q(k)}{P(k)}  - \mathcal{D}_{KL}(Q||P) \Bigr)$$




分析一下KL和RKL的梯度可以知道，对于k位置的梯度而言，KL始终为Q和P的差，而RKL可以看成是带有Q权重的Q和P的差（括号里面可以表示为类似$\phi(Q)-\phi(P)$的运算，这样整体就可以对应的表示为 $Q(k)\Bigl( \phi(Q(k)) - \phi(P(k)) \Bigr)$）。这样，当`Q(k)->0`的时候，RKL的梯度就趋于0，对应这部分的权重更新就被削弱了，而KL散度仍然只关注目标分布和当前分布之间的差值。因此说，RKL相比KL来说更关注那些主要成分的梯度更新。





# On\-Policy Distillation

## 基本原理



> 🔗**链接**：https://thinkingmachines\.ai/blog/on\-policy\-distillation
> 
> **🏘机构**：Thinking Machines



大模型根据目的一般可以将整个训练分为三个阶段：

**（1）Pre\-training**：即最原始的大模型的预训练过程，通过在海量数据集上进行下一个词预测的训练注入基本的世界知识。

**（2）Mid\-training**：介于预训练和后训练，其目的是强化某一个领域的知识注入。

**（3）Post\-training**：后训练一般的目的是增强模型的特定能力，比如指令遵循、工具调用、代码生成等。

现在的主流大模型一般都遵循预训练\-后训练的范式，有的模型在训练过程中会添加所谓mid\-training的过程（也可以叫持续预训练，CPT）。

Scaling Law说明了越大的模型、越大的数据规模最终会导致更好的泛化能力，但是大模型部署的成本是巨大的，直接调用API又涉及到隐私与便捷性的问题。另一方面，现有的结果表明，在特定的一些任务上，一些小模型经过微调后效果就可以很好了，并且通过大模型蒸馏的方法可以有效提升小模型的能力。

传统的蒸馏方式一般是off\-policy，即**离线蒸馏**，也就是通过大模型采样一些轨迹作为数据集去微调小模型；与之相对的就是on\-policy distillation，即**在线蒸馏**，学生网络在线生成对应的轨迹然后进行评分，这个评分一般来自教师网络的logits。这种方法比较像online RL。事实上，OPD本身解决的就是SFT（offline distillation）**泛化性差**与RL的**稀疏奖励问题，**可以视为两者的trade\-off。

![image\.png](backend/assets/images/opd/图片和附件/image%202.png)



![image\.png](backend/assets/images/opd/图片和附件/image%2030.png)



对应的代码可以简单表示为：

```Python
def compute_KL_loss(
    student_logits,
    teacher_logits,
    input_ids,
    attention_mask
):
    # TODO
    # 省略一些 mask 对齐以及预处理相关的代码
    token_kl = logp_s - logp_t * mask
    loss = token_kl.sum() / mask.sum()
    return loss 

def train(epochs=10):
    prompts = [
        "Explain quantum computing in simple terms.",
        "Write a short poem about spring."
    ]
    for epoch in range(epochs):         
        optimizer.zero_grad()  
               
        student_responses = generate_on_policy_data(student_model, tokenizer, prompts)
        full_sequences = student_responses   
              
        attention_mask = (full_sequences != tokenizer.pad_token_id).to(DEVICE)
        student_outputs = student_model(full_sequences, attention_mask=attention_mask)     
        student_logits = student_outputs.logits[:, :-1, :].contiguous()  
        
        with torch.no_grad():             
        teacher_outputs = teacher_model(full_sequences, attention_mask=attention_mask)   
        teacher_logits = teacher_outputs.logits[:, :-1, :].contiguous()
        loss_mask = attention_mask[:, 1:].contiguous()         
        
        loss = compute_KL_loss(
            student_logits, 
            teacher_logits, 
            input_ids,
            loss_mask
        )
        loss.backward()         
        optimizer.step()
```





## 大模型中的蒸馏

### Deepseek\-R1

Deepseek\-R1应该是大厂报告里面最早也是最完整地讨论蒸馏对于小模型的影响的工作了。关于蒸馏这块，R1使用的是**离线蒸馏**。R1使用80w个挑选后的样本用R1生成数据集然后进行离线微调，没有进行任何的RL强化。

![image\.png](backend/assets/images/opd/图片和附件/image%2010.png)

实验结果表明对于小模型而言，离线蒸馏可以让小模型的能力甚至逼近或超过SOTA闭源大模型（当时）。

另一方面，R1还做了蒸馏和强化学习的对比实验。实验结果表明将更强大的模型简化为更小的模型能够取得极佳的效果，**而依赖于本文中所提及的大规模强化学习的小型模型则需要巨大的计算能力，甚至可能无法达到简化后的模型的性能。**

![image\.png](backend/assets/images/opd/图片和附件/image%209.png)



### Qwen3

![image\.png](backend/assets/images/opd/图片和附件/image%204.png)

Qwen3的蒸馏发生在整个旗舰模型的RL后训练流程之后。Qwen3同时用到了这两种蒸馏方式：

- **离线蒸馏**：初始阶段使用 `/think` 和 `/no_think` 模式生成的教师模型的输出结合起来进行响应蒸馏。 这有助于轻量级学生模型培养基本的推理能力和不同思维模式之间的切换能力。

- **在线蒸馏**：离线蒸馏后学生模型生成决策轨迹以进行微调。 具体来说，对提示进行采样，并且学生模型以 `/think` 或 `/no_think` 模式生成响应。 然后，通过将学生模型的逻辑与教师模型的逻辑对齐来对学生模型进行微调，以最小化KL散度。

![image\.png](backend/assets/images/opd/图片和附件/image%208.png)

实验结果表明蒸馏的性能明显优于强化学习，同时只需要大约1/10的GPU 时间。（`pass@64`）



### HY\-MT1\.5

![image\.png](backend/assets/images/opd/图片和附件/image%2026.png)



HY\-MT 1\.5主要是针对翻译任务的模型，在蒸馏方面的主要出发点是strong\-weak的蒸馏，**数据**方面使用了总计1M的多语义的样本，其中包含33种语言。在**模型**的选择方面，教师网络选取了训练好的HY\-MT\-1\.5\-7B模型，目标的学生网络选择的是1\.8B的模型。**蒸馏方法**还是最基础的基于RKL的on\-policy distillation方式。

![image\.png](backend/assets/images/opd/图片和附件/image%2027.png)

在蒸馏完成之后，继续对学生网络使用类似的RL操作，形成最终版本的模型。





### MiMO\-v2 flash

![image\.png](backend/assets/images/opd/图片和附件/image%2012.png)



小米的MIMO\-v2 Flash，其中OPD阶段位于SFT和RL之后，这里更多的是将多教师知识进行集成，作为online RL过程的一部分。

损失函数为：

![image\.png](backend/assets/images/opd/图片和附件/image%2016.png)

其中奖励是本身logits与ORM奖励的混合：

![image\.png](backend/assets/images/opd/图片和附件/image%207.png)

![image\.png](backend/assets/images/opd/图片和附件/image%2028.png)

![image\.png](backend/assets/images/opd/图片和附件/image.png)





# 研究进展

## OPSD：自蒸馏与在线蒸馏



> **✉️标题**：On\-Policy Self\-Distillation for Large Language Models
> **🔗链接**：https://arxiv\.org/pdf/2601\.18734
> **🏘机构**：UCLA、HKU、Meta



![image\.png](backend/assets/images/opd/图片和附件/image%2021.png)

现在大语言模型的后训练算法基本以GRPO为基础的RLVR算法为主，但Deepseek\-R1发现高质量数据集下做SFT可以超过单纯的GRPO的性能。另一方面，SFT和RLVR作为后训练的两种范式，前者泛化性能有限经常会导致模型能力的退化，而后者的奖励稀疏会让模型参数不能得到有效的更新。相对应地OPD作为一种折中的方法具有很好的前景。

该论文想讨论的问题是：既然LLM本身的能力已经很强了，是不是它本身就可以有很好的能力去自己纠错呢？另一方面，**对于大模型来说，评判相比生成，是更简单的任务**。因此，OPSD认为直接使用大模型自身去做OPD就可以实现很好的效果。

OPSD的想法很简单，教师网络会提供一个额外的上下文来进行答案的增强，这个通常为ground\-truth答案。学生网络生成答案后，教师网络的logits为增强后的答案logits输出。相当于**教师网络在第一种解法的基础上去思考第二种解法。**OPSD的损失函数为：

![image\.png](backend/assets/images/opd/图片和附件/image%2014.png)

这里的损失函数选择的是JSD。对应的prompt模板为：

![image\.png](backend/assets/images/opd/图片和附件/image%2020.png)





## SDFT：自蒸馏与持续学习



> **✉️标题**：Self\-Distillation Enables Continual Learning
> **🔗链接**：https://arxiv\.org/pdf/2601\.19897
> **⛏代码**：http://idanshenfeld\.com/SDFT
> **🏘机构**：ETH、MIT




![image\.png](backend/assets/images/opd/图片和附件/image%2023.png)

现有的大模型模型参数始终是静态的，无法解决持续学习的问题。在线学习是目前解决持续学习的一类主流的方法，其中具有代表性的工作是强化学习方法，但是RL算法的核心在于奖励函数的设计，而在现实场景中这种奖励往往是难以获取的。另一方面，传统的学习方法一般是离线的SFT，这种方法会导致灾难性遗忘问题。

SDFT的流程和OPSD类似，**教师模型相比学生模型来说会多添加一个demonstration作为context上下文，文章认为这个提示足以阻止决策轨迹的直接省成本，而是利用其上下文学习能力来引发反映模型对演示背后意图的理解的响应。** 对应的prompt模板也是类似的：

![image\.png](backend/assets/images/opd/图片和附件/image%2031.png)

SDFT方法假设的核心是给定了上下文c，模型能做出更优的决策：

![image\.png](backend/assets/images/opd/图片和附件/image%2024.png)

SDFT的损失函数为：

![image\.png](backend/assets/images/opd/图片和附件/image%2018.png)

对应的梯度更新为：

![image\.png](backend/assets/images/opd/图片和附件/image%2022.png)





## SDPO：教师反馈与稠密信用分配



> **✉️标题**：Reinforcement Learning via Self\-Distillation
> **🔗链接**：https://arxiv\.org/pdf/2601\.20802
> **⛏代码**：https://github\.com/lasgroup/SDPO
> **🏘机构**：ETH、MIT、Stanford
> 
> 



![image\.png](backend/assets/images/opd/图片和附件/image%2025.png)



主要的出发点是加入feedback $f$后的策略应该优于只有问题的策略：$\pi_{\theta}(y|x,f) \succcurlyeq \pi_{\theta}(y|x)$。对应的损失函数为：

![image\.png](backend/assets/images/opd/图片和附件/image%2032.png)

![image\.png](backend/assets/images/opd/图片和附件/image%2013.png)

![image\.png](backend/assets/images/opd/图片和附件/image%2019.png)



可以看出其实关键在于这个动态的feedback，对于可以直接从环境中获得的数据（比如coding）来说，可以直接使用来自外部环境的feedback；对于不能提供直接反馈的场景，文章中使用了模型的不同的推理结果作为隐式的反馈。实验结果表明**来自环境的反馈和其他的样本推理结果是最重要的，反而模型的原始输出没那么必要。**

![image\.png](backend/assets/images/opd/图片和附件/image%205.png)





## OPCD：自蒸馏与上下文优化



> **✉️标题**：On\-Policy Context Distillation for Language Models 
> **🔗链接**：https://arxiv\.org/pdf/2602\.12275
> **⛏代码**：https://aka\.ms/GeneralAI
> **🏘机构**：微软
> 
> 



![image\.png](backend/assets/images/opd/图片和附件/image%201.png)

OPCD是一个典型的从上下文角度出发去对原始的OPD方法进行改进的工作，所以也可以说他是一个上下文蒸馏的工作。损失函数还是老生常谈的RKL，只不过加上了context的prompt设计。

![image\.png](backend/assets/images/opd/图片和附件/image%2017.png)

prompt设计方面，context是预先定义好的轨迹或者经验，直接加载进教师网络。医学的一个system prompt模板为：

![image\.png](backend/assets/images/opd/图片和附件/image%2033.png)





## OEL：在线经验学习



> **✉️标题**：Online Experiential Learning for Language Models
> **🔗链接**：https://arxiv\.org/pdf/2603\.16856
> **⛏代码**：https://aka\.ms/oel\-code
> **🏘机构**：微软
> 
> 



OEL是一个在线学习的框架，其目的在于使语言模型根据自身的部署经验不断进行优化提升。



![image\.png](backend/assets/images/opd/图片和附件/image%206.png)



总体来说OEL可以看成是OPCD的应用版，他的context是通过外部世界动态获得并抽取的。



![image\.png](backend/assets/images/opd/图片和附件/image%2011.png)





## G\-OPD：OPD与RL的关联挖掘



> **✉标题**：Learning beyond Teacher: Generalized On\-Policy Distillation with Reward Extrapolation
> **🔗链接**：https://arxiv\.org/pdf/2602\.12125
> **📷代码**：https://github\.com/RUCBM/G\-OPD
> **📰来源**：Arxiv 2026
> **🏫机构**：混元、人大高瓴
> 
> 



G\-OPD从公式推导的角度分析了RL与OPD算法之间的等价性。具体来说，OPD算法可以转化为RL的特殊形式。

总的来看，OPD相比RL而言，能提供密集的奖励信号与更灵活的reference model选择，但它的缺陷是KL散度和奖励函数的比列是固定的1：1。这也是本文期望改进的地方。

![image\.png](backend/assets/images/opd/图片和附件/image%203.png)

论文的核心改进可以抽象为上面这个公式，具体来说引入了两个模块：**超参数**$\color{red}{\lambda}$与**第三方模型**$\color{blue}{\pi_{ref}}$。前者用来控制奖励与模型更新的程度，特别地，当$\lambda >1$的时候学生网络的能力能超过教师网络；而参考模型的选取，这里为了和强化学习的重要性采样部分统一，选择的是教师网络的base model。





# 小结

![image\.png](backend/assets/images/opd/图片和附件/image%2029.png)



相比于传统的OPD，现有的改进方案可以看到很大一部分是集中在类似OPCD的工作上，即通过prompt设计增强教师网络的logit对于学生网络分数的奖励值，**通过引入c来增加教师网络的logits输出的信息。**因此，这类方法的关键在于上下文context的设计（**SDFT**、**OPCD**使用参考答案引导生成，**SDPO**的动态生成反馈……）。另一种方法则相对更底层一点，如混元的G\-OPD，通过探究OPD与RL之间的数学关联，从底层的计算原理进行对应的修改与完善，这类方法相对来说更general一点，但相比蒸馏来说更贴近RL，相对来说对于显卡的要求也更高。总结来看，个人感觉OPD方面可能对资源受限（比如笔者）的同学来说是个相对更友好的选择😂。



喜欢的麻烦点赞收藏感谢🙏⬇️

![Luban\_1775740011264a78ed383\-cbe4\-4f1f\-bb6c\-cc7d74e653aa\.png](backend/assets/images/opd/图片和附件/Luban_1775740011264a78ed383-cbe4-4f1f-bb6c-cc7d74e653aa.png)



